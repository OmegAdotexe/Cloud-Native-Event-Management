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

    @Query("SELECT a FROM AdminApplication a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:search IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AdminApplication> searchApplications(
            @Param("status") AdminApplicationStatus status,
            @Param("search") String search,
            Pageable pageable);
}
