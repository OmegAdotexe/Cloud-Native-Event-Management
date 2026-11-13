package com.campusconnect.auth.repository;

import com.campusconnect.auth.model.PasswordResetToken;
import com.campusconnect.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findTopByUserOrderByCreatedAtDesc(User user);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.used = true WHERE p.user = :user AND p.used = false")
    void invalidateAllActiveTokensForUser(@Param("user") User user);
}
