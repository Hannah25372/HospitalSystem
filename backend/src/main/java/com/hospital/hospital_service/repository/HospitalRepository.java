package com.hospital.hospital_service.repository;
import com.hospital.hospital_service.database.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
  }
