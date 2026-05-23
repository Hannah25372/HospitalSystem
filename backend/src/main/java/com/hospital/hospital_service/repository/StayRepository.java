package com.hospital.hospital_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hospital.hospital_service.database.Stay;

public interface StayRepository extends JpaRepository<Stay, Long> {

    Page<Stay> findByPatientId(Long patientId, Pageable pageable);

}
