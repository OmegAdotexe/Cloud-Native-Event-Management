package com.campusconnect.user.repository;

import com.campusconnect.user.model.AdminApplicationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminApplicationAuditRepository extends JpaRepository<AdminApplicationAudit, Long> {
    List<AdminApplicationAudit> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);
}
