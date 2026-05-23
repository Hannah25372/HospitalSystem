package com.hospital.hospital_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hospital.hospital_service.database.Patient;

public interface PatientRepository extends JpaRepository<Patient, Long>{
    
}
