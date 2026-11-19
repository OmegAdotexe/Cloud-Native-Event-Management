package com.campusconnect.user.repository;

import com.campusconnect.user.model.AdminApplicationAudit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminApplicationAuditRepository extends JpaRepository<AdminApplicationAudit, Long> {

    @EntityGraph(attributePaths = {"actor"})
    List<AdminApplicationAudit> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);
}
