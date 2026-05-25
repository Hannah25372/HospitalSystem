package com.hospital.hospital_service.repository;

import com.hospital.hospital_service.database.Hospital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    @Query("SELECT h FROM Hospital h WHERE EXISTS (SELECT hr FROM HospitalRegistration hr WHERE hr.hospital = h AND hr.patient.id = :patientId)")
    Page<Hospital> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);
}
