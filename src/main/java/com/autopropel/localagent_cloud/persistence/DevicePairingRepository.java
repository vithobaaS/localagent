package com.autopropel.localagent_cloud.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DevicePairingRepository extends JpaRepository<DevicePairing, Long> {
    Optional<DevicePairing> findByPairingCode(String pairingCode);
}
