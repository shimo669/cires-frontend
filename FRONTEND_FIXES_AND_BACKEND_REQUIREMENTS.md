# CIRES Frontend Fixes & Backend Requirements

## Problem
When users submitted a report, the following fields were being recorded as empty in the database:
- **Category** (recorded as NULL instead of category name)
- **Location** (recorded as NULL instead of location name)
- **SLA Deadline** (possibly mapping to wrong database field)

---

## Frontend Fixes Implemented

### 1. **Extended GeographyDropdowns Component** 
- **File**: `src/components/form/GeographyDropdowns.tsx`
- **Changes**:
  - Added tracking for location names alongside IDs (provinceName, districtName, sectorName, cellName, villageName)
  - Added new callback `onSelectionChangeWithNames` that returns both IDs and names
  - When a user selects a location at any level, the component now emits:
    ```typescript
    {
      provinceId: number,
      provinceName: string,
      districtId: number,
      districtName: string,
      sectorId: number,
      sectorName: string,
      cellId: number,
      cellName: string,
      villageId: number,
      villageName: string
    }
    ```

### 2. **Updated SubmitReport Form**
- **File**: `src/pages/citizen/SubmitReport.tsx`
- **Changes**:
  - Added `categoryName` state to capture the full category name when user selects a category
  - Added `locationName` state to store the complete location string (Province, District, Sector, Cell, Village)
  - Category dropdown now captures both `categoryId` AND `categoryName` on change
  - Geography picker now emits location names and builds a complete location string
  - The form now submits:
    ```typescript
    {
      title: string,
      description: string,
      categoryId: number,
      categoryName: string,        // ← NEW: Now sending category name
      incidentLocationId: number,
      incidentLocationName: string, // ← NEW: Now sending location string
      provinceId: number,
      districtId: number,
      sectorId: number,
      cellId: number,
      villageId: number,
      slaDeadline: string
    }
    ```

### 3. **Updated Type Definitions**
- **File**: `src/types/report.ts`
- **Changes**:
  - Extended `CreateReportRequest` to include:
    - `categoryName: string` - The human-readable category name
    - `incidentLocationName: string` - The full location path (e.g., "Kigali, Gasabo, Gisozi, Cell A, Muhima")

---

## Backend Requirements to Complete the Fix

### Your Spring Boot Controller Needs to Accept the New Fields

Your `CreateReportRequest` DTO on the backend must now include:

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {
    private String title;
    private String description;
    private Integer categoryId;
    private String categoryName;              // ← ADD THIS
    private Integer incidentLocationId;
    private String incidentLocationName;      // ← ADD THIS
    private Integer provinceId;
    private Integer districtId;
    private Integer sectorId;
    private Integer cellId;
    private Integer villageId;
    private String slaDeadline;
}
```

### Your Report Entity Must Map These Fields

Update your `Report` JPA entity:

```java
@Entity
@Table(name = "reports")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    
    @Column(name = "category")           // or your actual column name
    private String category;             // ← Make sure this maps to the category name
    
    @Column(name = "location")           // or your actual column name
    private String location;             // ← Make sure this maps to the location name
    
    @Column(name = "category_id")
    private Integer categoryId;          // Store the ID too if needed
    
    @Column(name = "incident_location_id")
    private Integer incidentLocationId;
    
    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;   // Ensure this is the correct column name
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // ... other fields
}
```

### Your Report Service Must Extract and Save the Values

In your `ReportService.java`:

```java
@Service
@Transactional
public class ReportService {
    
    @Autowired
    private ReportRepository reportRepository;
    
    @Autowired
    private LocationRepository locationRepository;  // If you need to fetch location names
    
    public Report createReport(CreateReportRequest request, User currentUser) {
        Report report = new Report();
        
        report.setTitle(request.getTitle());
        report.setDescription(request.getDescription());
        
        // ← FIX: Use the categoryName coming from frontend
        report.setCategory(request.getCategoryName());
        report.setCategoryId(request.getCategoryId());
        
        // ← FIX: Use the incidentLocationName coming from frontend
        report.setLocation(request.getIncidentLocationName());
        report.setIncidentLocationId(request.getIncidentLocationId());
        
        // ← FIX: Parse the ISO string to the correct DateTime format
        report.setSlaDeadline(LocalDateTime.parse(request.getSlaDeadline(), 
            DateTimeFormatter.ISO_DATE_TIME));
        
        report.setStatus("PENDING");
        report.setCreatedAt(LocalDateTime.now());
        report.setUser(currentUser);
        
        return reportRepository.save(report);
    }
}
```

### Verify Your Database Columns

Make sure your `reports` table has these columns:
```sql
CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),              -- ← This must exist
    location VARCHAR(500),              -- ← This must exist
    category_id INT,
    incident_location_id INT,
    sla_deadline TIMESTAMP,             -- ← Verify the column name matches
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Testing the Fix

### Frontend
1. Open the application and navigate to "Report a New Issue"
2. Fill in:
   - **Title**: "Test Report"
   - **Category**: Select any category (e.g., "Water")
   - **Description**: "Test description"
   - **Location**: Select Province → District → Sector → Cell → Village
3. Submit the form
4. Open browser DevTools → Network tab
5. Check the POST request to `/api/reports`
6. You should see in the request body:
   ```json
   {
     "title": "Test Report",
     "description": "Test description",
     "categoryId": 1,
     "categoryName": "Water",
     "incidentLocationId": 123,
     "incidentLocationName": "Kigali, Gasabo, Gisozi, Cell A, Muhima",
     "provinceId": 1,
     "districtId": 5,
     "sectorId": 12,
     "cellId": 45,
     "villageId": 120,
     "slaDeadline": "2026-04-11T08:30:45.123Z"
   }
   ```

### Backend
1. Add logging to your `ReportService.createReport()`:
   ```java
   @Service
   public class ReportService {
       private static final Logger logger = LoggerFactory.getLogger(ReportService.class);
       
       public Report createReport(CreateReportRequest request, User currentUser) {
           logger.info("Creating report with category: {}, location: {}, slaDeadline: {}",
               request.getCategoryName(), 
               request.getIncidentLocationName(),
               request.getSlaDeadline());
           
           // ... rest of the code
       }
   }
   ```

2. Check the database after submission:
   ```sql
   SELECT id, title, category, location, sla_deadline, status FROM reports 
   ORDER BY created_at DESC LIMIT 1;
   ```
   You should see all three fields populated (not NULL).

---

## Summary of Changes

| Field | Frontend Change | Backend Change Required |
|-------|-----------------|-------------------------|
| **Category** | Now sends `categoryName` | Accept `categoryName` in DTO and map to `category` column |
| **Location** | Now sends full location string via `incidentLocationName` | Accept `incidentLocationName` in DTO and map to `location` column |
| **SLA Deadline** | Already sent correctly as ISO string | Ensure column name is `sla_deadline` and parsing is correct |

---

## Additional Notes

- The frontend now validates that **all address levels** (Province through Village) must be selected before submission
- Location names are collected during the dropdown selection process and sent with the request
- If any backend field mapping is different from what's shown above, update the column names accordingly in your entity and service

Good luck! 🚀

