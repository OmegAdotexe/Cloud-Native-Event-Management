package com.campusconnect.user.repository;

import com.campusconnect.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleSub(String googleSub);
    java.util.List<User> findByRole(com.campusconnect.user.model.Role role);
    boolean existsByEmail(String email);
    long countByRole(com.campusconnect.user.model.Role role);
}
