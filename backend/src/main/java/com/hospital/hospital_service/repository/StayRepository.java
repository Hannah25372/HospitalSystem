package com.hospital.hospital_service.repository;

import com.hospital.hospital_service.database.Stay;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StayRepository extends JpaRepository<Stay, Long> {

    Page<Stay> findByPatientId(Long patientId, Pageable pageable);

    boolean existsByHospitalId(Long hospitalId);

    boolean existsByPatientId(Long patientId);
}
