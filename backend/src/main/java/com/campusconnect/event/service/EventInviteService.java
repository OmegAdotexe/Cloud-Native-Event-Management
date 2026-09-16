package com.campusconnect.event.service;

import com.campusconnect.event.dto.CreateInvitesRequest;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventInvite;
import com.campusconnect.event.repository.EventInviteRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventInviteService {

    private final EventInviteRepository eventInviteRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createInvites(Long eventId, CreateInvitesRequest request, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);

        for (Long participantId : request.getParticipantIds()) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + participantId));

            if (!eventInviteRepository.existsByEventAndParticipant(event, participant)) {
                EventInvite invite = EventInvite.builder()
                        .event(event)
                        .participant(participant)
                        .build();
                eventInviteRepository.save(invite);
            }
        }
    }

    private void ensureOwnerOrSuperAdmin(Event event, User requester) {
        if (requester.getRole() == Role.SUPER_ADMIN) return;
        if (requester.getRole() != Role.EVENT_ADMIN || !event.getCreatedBy().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to manage this event's invites");
        }
    }
}
