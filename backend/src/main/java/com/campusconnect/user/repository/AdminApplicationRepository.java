package com.campusconnect.user.repository;

import com.campusconnect.user.model.AdminApplication;
import com.campusconnect.user.model.AdminApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminApplicationRepository extends JpaRepository<AdminApplication, Long> {

    Optional<AdminApplication> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    List<AdminApplication> findByUserId(Long userId);

    boolean existsByUserIdAndStatus(Long userId, AdminApplicationStatus status);

    boolean existsByEmailAndStatus(String email, AdminApplicationStatus status);

    long countByStatus(AdminApplicationStatus status);

    Page<AdminApplication> findByStatus(AdminApplicationStatus status, Pageable pageable);

    @Query("SELECT a FROM AdminApplication a WHERE " +
           "a.status = :status AND (" +
           "LOWER(a.fullName) LIKE :search OR " +
           "LOWER(a.email) LIKE :search OR " +
           "LOWER(a.department) LIKE :search)")
    Page<AdminApplication> findByStatusAndSearch(
            @Param("status") AdminApplicationStatus status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT a FROM AdminApplication a WHERE " +
           "LOWER(a.fullName) LIKE :search OR " +
           "LOWER(a.email) LIKE :search OR " +
           "LOWER(a.department) LIKE :search")
    Page<AdminApplication> findBySearch(
            @Param("search") String search,
            Pageable pageable);
}
