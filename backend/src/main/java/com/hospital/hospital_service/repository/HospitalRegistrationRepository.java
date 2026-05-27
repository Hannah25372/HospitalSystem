package com.hospital.hospital_service.repository;

import com.hospital.hospital_service.database.HospitalRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface HospitalRegistrationRepository extends JpaRepository<HospitalRegistration, Long> {

    @Modifying
    @Query("DELETE FROM HospitalRegistration r WHERE r.hospital.id = :hospitalId")
    void deleteByHospitalId(Long hospitalId);

    @Modifying
    @Query("DELETE FROM HospitalRegistration r WHERE r.patient.id = :patientId")
    void deleteByPatientId(Long patientId);

     Optional<HospitalRegistration> findByHospitalIdAndPatientId(Long hospitalId, Long patientId);
}
