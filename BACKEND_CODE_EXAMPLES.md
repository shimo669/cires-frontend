# Backend Code Examples - Complete Implementation

## 1. Update Your CreateReportRequest DTO

**File**: `src/main/java/com/your_package/dto/CreateReportRequest.java`

```java
package com.yourpackage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {
    private String title;
    private String description;
    
    private Integer categoryId;
    private String categoryName;              // ← ADD THIS LINE
    
    private Integer incidentLocationId;
    private String incidentLocationName;      // ← ADD THIS LINE
    
    // Address hierarchy IDs
    private Integer provinceId;
    private Integer districtId;
    private Integer sectorId;
    private Integer cellId;
    private Integer villageId;
    
    private String slaDeadline;
    
    // Getters and setters are handled by Lombok @Data
}
```

---

## 2. Update Your Report Entity

**File**: `src/main/java/com/your_package/entity/Report.java`

```java
package com.yourpackage.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Report {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "category", length = 100)
    private String category;                  // ← STORE CATEGORY NAME HERE
    
    @Column(name = "location", length = 500)
    private String location;                  // ← STORE FULL LOCATION STRING HERE
    
    @Column(name = "category_id")
    private Integer categoryId;               // Also store ID for reference
    
    @Column(name = "incident_location_id")
    private Integer incidentLocationId;
    
    // Address hierarchy for future use
    @Column(name = "province_id")
    private Integer provinceId;
    
    @Column(name = "district_id")
    private Integer districtId;
    
    @Column(name = "sector_id")
    private Integer sectorId;
    
    @Column(name = "cell_id")
    private Integer cellId;
    
    @Column(name = "village_id")
    private Integer villageId;
    
    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;        // ← ENSURE THIS COLUMN EXISTS
    
    @Column(name = "status", length = 50)
    private String status;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "current_escalation_level", length = 50)
    private String currentEscalationLevel;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## 3. Update Your ReportService

**File**: `src/main/java/com/your_package/service/ReportService.java`

```java
package com.yourpackage.service;

import com.yourpackage.dto.CreateReportRequest;
import com.yourpackage.entity.Report;
import com.yourpackage.entity.User;
import com.yourpackage.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j  // Lombok logging
public class ReportService {
    
    private final ReportRepository reportRepository;
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    
    public Report createReport(CreateReportRequest request, User currentUser) {
        // Log the incoming request for debugging
        log.info("Creating report - Title: {}, Category: {}, Location: {}, SLA: {}", 
            request.getTitle(),
            request.getCategoryName(),       // ← NEW: Log category name
            request.getIncidentLocationName(), // ← NEW: Log location name
            request.getSlaDeadline());
        
        Report report = new Report();
        
        // Set basic fields
        report.setTitle(request.getTitle());
        report.setDescription(request.getDescription());
        
        // ← KEY FIX: Set category name and ID
        report.setCategory(request.getCategoryName());
        report.setCategoryId(request.getCategoryId());
        
        // ← KEY FIX: Set location name and ID
        report.setLocation(request.getIncidentLocationName());
        report.setIncidentLocationId(request.getIncidentLocationId());
        
        // ← KEY FIX: Parse and set SLA deadline
        try {
            LocalDateTime slaDeadline = LocalDateTime.parse(
                request.getSlaDeadline(), 
                ISO_FORMATTER
            );
            report.setSlaDeadline(slaDeadline);
        } catch (Exception e) {
            log.warn("Failed to parse SLA deadline: {}", request.getSlaDeadline(), e);
            // Fallback: set to current time + 72 hours
            report.setSlaDeadline(LocalDateTime.now().plusHours(72));
        }
        
        // Store address hierarchy for future location lookups
        report.setProvinceId(request.getProvinceId());
        report.setDistrictId(request.getDistrictId());
        report.setSectorId(request.getSectorId());
        report.setCellId(request.getCellId());
        report.setVillageId(request.getVillageId());
        
        // Set default values
        report.setStatus("PENDING");
        report.setCurrentEscalationLevel("AT_VILLAGE");
        report.setUser(currentUser);
        
        // Save to database
        Report savedReport = reportRepository.save(report);
        
        log.info("Report created successfully - ID: {}, Category: {}, Location: {}", 
            savedReport.getId(),
            savedReport.getCategory(),
            savedReport.getLocation());
        
        return savedReport;
    }
    
    public List<Report> getMyReports(User user) {
        return reportRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
    
    public List<Report> getReportsByLevel(String level) {
        return reportRepository.findByCurrentEscalationLevelOrderByCreatedAtDesc(level);
    }
    
    public Report resolveReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus("RESOLVED");
        return reportRepository.save(report);
    }
    
    public Report escalateReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus("ESCALATED");
        // Update escalation level based on your business logic
        return reportRepository.save(report);
    }
}
```

---

## 4. Update Your ReportController

**File**: `src/main/java/com/your_package/controller/ReportController.java`

```java
package com.yourpackage.controller;

import com.yourpackage.dto.CreateReportRequest;
import com.yourpackage.dto.ApiResponse;
import com.yourpackage.entity.Report;
import com.yourpackage.entity.User;
import com.yourpackage.security.CurrentUser;
import com.yourpackage.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    
    private final ReportService reportService;
    
    @PostMapping
    public ResponseEntity<?> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @CurrentUser User currentUser) {
        
        try {
            Report report = reportService.createReport(request, currentUser);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                    "Report created successfully",
                    report,
                    true
                ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                    "Failed to create report: " + e.getMessage(),
                    null,
                    false
                ));
        }
    }
    
    @GetMapping("/my-reports")
    public ResponseEntity<?> getMyReports(@CurrentUser User currentUser) {
        List<Report> reports = reportService.getMyReports(currentUser);
        return ResponseEntity.ok(new ApiResponse<>(
            "Reports retrieved successfully",
            reports,
            true
        ));
    }
    
    @GetMapping("/level/{level}")
    public ResponseEntity<?> getReportsByLevel(@PathVariable String level) {
        List<Report> reports = reportService.getReportsByLevel(level);
        return ResponseEntity.ok(new ApiResponse<>(
            "Reports for level " + level + " retrieved successfully",
            reports,
            true
        ));
    }
    
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable Long id) {
        Report report = reportService.resolveReport(id);
        return ResponseEntity.ok(new ApiResponse<>(
            "Report resolved successfully",
            report,
            true
        ));
    }
    
    @PutMapping("/{id}/escalate")
    public ResponseEntity<?> escalateReport(@PathVariable Long id) {
        Report report = reportService.escalateReport(id);
        return ResponseEntity.ok(new ApiResponse<>(
            "Report escalated successfully",
            report,
            true
        ));
    }
}
```

---

## 5. Database Migration (if using Flyway/Liquibase)

**File**: `resources/db/migration/V1.1__Add_category_location_fields.sql`

```sql
-- Add missing columns if they don't exist
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) AFTER `description`;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `location` VARCHAR(500) AFTER `category`;

-- Add address hierarchy columns if they don't exist
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `province_id` INT AFTER `location`;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `district_id` INT AFTER `province_id`;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `sector_id` INT AFTER `district_id`;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `cell_id` INT AFTER `sector_id`;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS `village_id` INT AFTER `cell_id`;

-- Ensure sla_deadline column exists with correct type
ALTER TABLE reports
MODIFY COLUMN IF EXISTS `sla_deadline` DATETIME;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_reports_category` ON reports(`category`);
CREATE INDEX IF NOT EXISTS `idx_reports_status` ON reports(`status`);
CREATE INDEX IF NOT EXISTS `idx_reports_sla_deadline` ON reports(`sla_deadline`);
```

Or if using plain SQL with no migration tool:

```sql
ALTER TABLE reports
ADD COLUMN category VARCHAR(100) NULL;

ALTER TABLE reports
ADD COLUMN location VARCHAR(500) NULL;

ALTER TABLE reports
ADD COLUMN province_id INT NULL;

ALTER TABLE reports
ADD COLUMN district_id INT NULL;

ALTER TABLE reports
ADD COLUMN sector_id INT NULL;

ALTER TABLE reports
ADD COLUMN cell_id INT NULL;

ALTER TABLE reports
ADD COLUMN village_id INT NULL;

ALTER TABLE reports
MODIFY sla_deadline DATETIME;

CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_sla_deadline ON reports(sla_deadline);
```

---

## 6. Validate the Fix

### Check Database After Submission

```sql
-- View the newly created report with all fields populated
SELECT 
    id,
    title,
    category,
    location,
    category_id,
    incident_location_id,
    sla_deadline,
    status,
    created_at
FROM reports
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Output**:
```
┌────┬──────────────────┬─────────┬─────────────────────────────────────┬─────────┬──────────────────┬─────────────────────┬────────┬─────────────────────┐
│ id │ title            │category │ location                            │cat_id   │ incident_loc_id  │ sla_deadline        │ status │ created_at          │
├────┼──────────────────┼─────────┼─────────────────────────────────────┼─────────┼──────────────────┼─────────────────────┼────────┼─────────────────────┤
│ 45 │Broken Water Pipe │ Water   │ Kigali, Gasabo, Gisozi, Cell A... │   1     │       120        │ 2026-04-11 08:30:45 │PENDING │ 2026-04-08 08:20:10 │
└────┴──────────────────┴─────────┴─────────────────────────────────────┴─────────┴──────────────────┴─────────────────────┴────────┴─────────────────────┘
```

### Check API Response

```json
{
  "message": "Report created successfully",
  "data": {
    "id": 45,
    "title": "Broken Water Pipe",
    "description": "Water leaking from the main pipe near...",
    "category": "Water",
    "location": "Kigali, Gasabo, Gisozi, Cell A, Muhima",
    "categoryId": 1,
    "incidentLocationId": 120,
    "provinceId": 1,
    "districtId": 5,
    "sectorId": 12,
    "cellId": 45,
    "villageId": 120,
    "slaDeadline": "2026-04-11T08:30:45",
    "status": "PENDING",
    "createdAt": "2026-04-08T08:20:10",
    "currentEscalationLevel": "AT_VILLAGE"
  },
  "success": true
}
```

---

## Common Issues & Solutions

### ❌ Issue: "Unknown column 'category' in field list"
**Solution**: Run the database migration SQL to add missing columns.

### ❌ Issue: "Failed to instantiate CreateReportRequest - undefined constructor"
**Solution**: Make sure you have `@NoArgsConstructor` and `@AllArgsConstructor` from Lombok on your DTO.

### ❌ Issue: Category/Location still NULL after submission
**Solution**: 
1. Check that your Report entity has the `@Column` annotations correctly set
2. Verify the DTO is receiving the `categoryName` and `incidentLocationName` fields
3. Check the service is actually calling `.setCategory()` and `.setLocation()`

### ❌ Issue: SLA Deadline parsing error
**Solution**: 
- Frontend sends ISO format: `"2026-04-11T08:30:45.123Z"`
- Use `DateTimeFormatter.ISO_DATE_TIME` for parsing
- Or use `LocalDateTime.parse(isoString)` directly

---

## Summary

✅ **Frontend Changes**: Captures and sends `categoryName` and `incidentLocationName`
✅ **Backend DTO**: Accepts the new fields
✅ **Backend Entity**: Maps them to database columns
✅ **Backend Service**: Stores them in the database
✅ **Database**: Has columns to store the values

Once you implement these backend changes and deploy, the issue should be completely resolved! 🎉

