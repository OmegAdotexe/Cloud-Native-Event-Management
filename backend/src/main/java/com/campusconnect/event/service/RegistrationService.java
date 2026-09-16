package com.campusconnect.event.service;

import com.campusconnect.event.dto.RegistrationResponse;
import com.campusconnect.event.model.*;
import com.campusconnect.event.repository.EventInviteRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final EventInviteRepository eventInviteRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RegistrationResponse registerForEvent(Long eventId, User participant) {
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot register for an event that is not PUBLISHED");
        }

        if (event.getRegistrationDeadline() != null && LocalDateTime.now().isAfter(event.getRegistrationDeadline())) {
            throw new IllegalStateException("Registration deadline has passed");
        }

        registrationRepository.findByEventAndParticipant(event, participant)
                .ifPresent(r -> {
                    if (r.getStatus() == RegistrationStatus.CANCELLED) {
                        throw new IllegalStateException("You cannot re-register for this event after cancelling");
                    } else if (r.getStatus() == RegistrationStatus.REJECTED) {
                        throw new IllegalStateException("Your registration for this event was rejected");
                    } else {
                        throw new IllegalStateException("Participant already has an active registration for this event");
                    }
                });

        if (event.getRegistrationMode() == RegistrationMode.INVITE_ONLY) {
            if (!eventInviteRepository.existsByEventAndParticipant(event, participant)) {
                throw new AccessDeniedException("You are not on the invite list for this event");
            }
        }

        Registration registration = Registration.builder()
                .event(event)
                .participant(participant)
                .build();

        int confirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);

        if (event.getRegistrationMode() == RegistrationMode.APPROVAL_REQUIRED) {
            registration.setStatus(RegistrationStatus.PENDING);
        } else if (confirmedCount < event.getCapacity()) {
            registration.setStatus(RegistrationStatus.CONFIRMED);
        } else if (event.getWaitlistEnabled()) {
            registration.setStatus(RegistrationStatus.WAITLISTED);
        } else {
            throw new IllegalStateException("Event capacity is full");
        }

        Registration savedRegistration = registrationRepository.save(registration);

        if (savedRegistration.getStatus() == RegistrationStatus.CONFIRMED) {
            eventPublisher.publishEvent(new RegistrationConfirmedEvent(
                    savedRegistration.getId(),
                    event.getId(),
                    participant.getId()
            ));
        }

        return toResponse(savedRegistration);
    }

    @Transactional
    public RegistrationResponse cancelRegistration(Long eventId, Long registrationId, User requester) {
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));

        if (!registration.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Registration does not belong to this event");
        }

        ensureOwnerOrSuperAdminOrSelf(event, requester, registration.getParticipant().getId());

        if (registration.getStatus() == RegistrationStatus.CANCELLED || registration.getStatus() == RegistrationStatus.REJECTED) {
            throw new IllegalStateException("Registration is already CANCELLED or REJECTED");
        }

        RegistrationStatus oldStatus = registration.getStatus();
        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(LocalDateTime.now());
        registrationRepository.save(registration);

        if (oldStatus == RegistrationStatus.CONFIRMED && event.getWaitlistEnabled()) {
            promoteWaitlistedParticipant(event);
        }

        return toResponse(registration);
    }

    private void promoteWaitlistedParticipant(Event event) {
        registrationRepository.findFirstByEventAndStatusOrderByRegisteredAtAsc(event, RegistrationStatus.WAITLISTED)
                .ifPresent(promotedRegistration -> {
                    promotedRegistration.setStatus(RegistrationStatus.CONFIRMED);
                    registrationRepository.save(promotedRegistration);

                    eventPublisher.publishEvent(new RegistrationConfirmedEvent(
                            promotedRegistration.getId(),
                            event.getId(),
                            promotedRegistration.getParticipant().getId()
                    ));
                });
    }

    @Transactional
    public RegistrationResponse approveRegistration(Long eventId, Long registrationId, User requester) {
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));

        if (!registration.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Registration does not belong to this event");
        }

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new IllegalStateException("Only PENDING registrations can be approved");
        }

        int confirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);

        if (confirmedCount < event.getCapacity()) {
            registration.setStatus(RegistrationStatus.CONFIRMED);
            eventPublisher.publishEvent(new RegistrationConfirmedEvent(
                    registration.getId(),
                    event.getId(),
                    registration.getParticipant().getId()
            ));
        } else if (event.getWaitlistEnabled()) {
            registration.setStatus(RegistrationStatus.WAITLISTED);
        } else {
            throw new IllegalStateException("Event capacity is full and waitlist is not enabled");
        }

        registration.setRespondedAt(LocalDateTime.now());
        registration.setRespondedByAdminId(requester.getId());
        return toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public RegistrationResponse rejectRegistration(Long eventId, Long registrationId, User requester, String reason) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);

        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Registration not found"));

        if (!registration.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Registration does not belong to this event");
        }

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new IllegalStateException("Only PENDING registrations can be rejected");
        }

        registration.setStatus(RegistrationStatus.REJECTED);
        registration.setRespondedAt(LocalDateTime.now());
        registration.setRespondedByAdminId(requester.getId());

        // We don't save the reason anywhere per the instructions, but we accept it as input.
        return toResponse(registrationRepository.save(registration));
    }

    public Page<RegistrationResponse> getEventRegistrations(Long eventId, RegistrationStatus status, Pageable pageable, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);

        Page<Registration> page;
        if (status != null) {
            page = registrationRepository.findByEventAndStatus(event, status, pageable);
        } else {
            page = registrationRepository.findByEvent(event, pageable);
        }

        return page.map(this::toResponse);
    }

    public List<RegistrationResponse> getMyRegistrations(User participant) {
        return registrationRepository.findByParticipantOrderByRegisteredAtDesc(participant)
                .stream().map(this::toResponse).toList();
    }

    private void ensureOwnerOrSuperAdmin(Event event, User requester) {
        if (requester.getRole() == Role.SUPER_ADMIN) return;
        if (requester.getRole() != Role.EVENT_ADMIN || !event.getCreatedBy().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to manage this event's registrations");
        }
    }

    private void ensureOwnerOrSuperAdminOrSelf(Event event, User requester, Long participantId) {
        if (requester.getId().equals(participantId)) return;
        ensureOwnerOrSuperAdmin(event, requester);
    }

    private RegistrationResponse toResponse(Registration registration) {
        return RegistrationResponse.builder()
                .id(registration.getId())
                .eventId(registration.getEvent().getId())
                .eventTitle(registration.getEvent().getTitle())
                .eventStartTime(registration.getEvent().getStartTime())
                .eventStatus(registration.getEvent().getStatus().name())
                .eventVenueName(registration.getEvent().getVenueName())
                .eventIsVirtual(registration.getEvent().getIsVirtual())
                .eventVirtualLink(registration.getEvent().getVirtualLink())
                .eventRegistrationMode(registration.getEvent().getRegistrationMode().name())
                .participantId(registration.getParticipant().getId())
                .participantName(registration.getParticipant().getName())
                .status(registration.getStatus())
                .registeredAt(registration.getRegisteredAt())
                .respondedAt(registration.getRespondedAt())
                .respondedByAdminId(registration.getRespondedByAdminId())
                .cancelledAt(registration.getCancelledAt())
                .build();
    }
}
