package com.hospital.hospital_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hospital.hospital_service.database.HospitalRegistration;

public interface HospitalRegistrationRepository extends JpaRepository<HospitalRegistration, Long>{
    
}
