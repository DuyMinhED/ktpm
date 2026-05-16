package com.project.service.impl;

import com.project.dto.response.AppointmentSnippetDto;
import com.project.dto.response.DashboardStatsDto;
import com.project.dto.response.DoctorDashboardResponse;
import com.project.dto.response.DoctorPatientResponse;
import com.project.repository.AppointmentRepository;
import com.project.repository.MessageRepository;
import com.project.service.ClinicalAnalyticsService;
import com.project.service.DoctorDashboardService;
import com.project.service.DoctorPatientService;
import com.project.entity.AppointmentStatus;
import com.project.util.AppConstants;
import com.project.util.DateTimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorDashboardServiceImpl implements DoctorDashboardService {

        private final AppointmentRepository appointmentRepository;
        private final MessageRepository messageRepository;
        private final DoctorPatientService doctorPatientService;
        private final ClinicalAnalyticsService clinicalAnalyticsService;

        @Override
        @Transactional(readOnly = true)
        @org.springframework.cache.annotation.Cacheable(value = "doctor_dashboard", key = "#doctorId")
        public DoctorDashboardResponse getDashboardData(Long doctorId) {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

                // 1. Fetch Stats in parallel
                java.util.concurrent.CompletableFuture<Long> totalPatientsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        doctorPatientService.getTotalPatientCount(doctorId));
                
                java.util.concurrent.CompletableFuture<Long> highRiskCountFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        doctorPatientService.getHighRiskCount(doctorId));
                
                java.util.concurrent.CompletableFuture<Long> pendingAppointmentsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        appointmentRepository.countByDoctorIdAndStatusInAndAppointmentTimeAfter(
                                doctorId,
                                java.util.List.of(AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED),
                                now));

                java.util.concurrent.CompletableFuture<Long> unreadMessagesFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        messageRepository.countByConversationDoctorIdAndIsReadFalseAndSenderIdNot(doctorId, doctorId));

                // 2. Fetch Appointments & Patients in parallel
                java.util.concurrent.CompletableFuture<List<AppointmentSnippetDto>> upcomingAppointmentsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        appointmentRepository.findUpcomingAppointments(doctorId, startOfToday, PageRequest.of(0, 5))
                                .stream()
                                .map(apt -> AppointmentSnippetDto.builder()
                                                .id(apt.getId())
                                                .patientName(apt.getPatient() != null ? apt.getPatient().getFullName() : "N/A")
                                                .displayTime(apt.getAppointmentTime() != null ? DateTimeUtils.formatForDashboard(apt.getAppointmentTime()) : "N/A")
                                                .type(apt.getType())
                                                .isPast(apt.getAppointmentTime() != null && apt.getAppointmentTime().isBefore(now))
                                                .avatarUrl(apt.getPatient() != null ? apt.getPatient().getAvatarUrl() : null)
                                                .age(apt.getPatient() != null && apt.getPatient().getDateOfBirth() != null ? java.time.Period.between(apt.getPatient().getDateOfBirth(), java.time.LocalDate.now()).getYears() : null)
                                                .condition(apt.getPatient() != null ? apt.getPatient().getChronicCondition() : "N/A")
                                                .gender(apt.getPatient() != null ? apt.getPatient().getGender() : "N/A")
                                                .build())
                                .collect(Collectors.toList()));

                java.util.concurrent.CompletableFuture<List<DoctorPatientResponse>> recentPatientsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        doctorPatientService.getMyPatients(doctorId, null, null, null, PageRequest.of(0, 5)).getContent());

                java.util.concurrent.CompletableFuture<List<DoctorPatientResponse>> highRiskPatientsDataFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        doctorPatientService.getMyPatients(doctorId, null, null, AppConstants.RISK_HIGH, PageRequest.of(0, 5)).getContent());

                java.util.concurrent.CompletableFuture<java.util.List<String>> insightsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                        clinicalAnalyticsService.getDoctorInsights(doctorId));

                // Wait for all
                java.util.concurrent.CompletableFuture.allOf(
                        totalPatientsFuture, highRiskCountFuture, pendingAppointmentsFuture, unreadMessagesFuture,
                        upcomingAppointmentsFuture, recentPatientsFuture, highRiskPatientsDataFuture, insightsFuture
                ).join();

                DashboardStatsDto stats = DashboardStatsDto.builder()
                                .totalPatients(totalPatientsFuture.join())
                                .highRiskCount(highRiskCountFuture.join())
                                .pendingAppointmentsCount(pendingAppointmentsFuture.join())
                                .unreadMessagesCount(unreadMessagesFuture.join())
                                .build();

                return DoctorDashboardResponse.builder()
                                .stats(stats)
                                .upcomingAppointments(upcomingAppointmentsFuture.join())
                                .recentPatients(recentPatientsFuture.join())
                                .highRiskPatients(highRiskPatientsDataFuture.join())
                                .insights(insightsFuture.join())
                                .build();
        }
}
