package com.hospital.hospital_service.repository;

import com.hospital.hospital_service.database.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    @Query("SELECT p FROM Patient p WHERE EXISTS (SELECT hr FROM HospitalRegistration hr WHERE hr.patient = p AND hr.hospital.id = :hospitalId)")
    Page<Patient> findByHospitalId(@Param("hospitalId") Long hospitalId, Pageable pageable);
}
