package com.hospital.hospital_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hospital.hospital_service.database.Stay;

public interface StayRepository extends JpaRepository<Stay, Long> {

  }
