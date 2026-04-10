# API Payload Reference

## Report Submission Payload Structure

### Request Body (What Frontend Sends Now)

```json
{
  "title": "Broken Water Pipe at Main Street",
  "description": "The main water pipe near the market is leaking water continuously. This is causing water wastage and flooding the nearby area. Immediate repair is needed.",
  "categoryId": 1,
  "categoryName": "Water",
  "incidentLocationId": 120,
  "incidentLocationName": "Kigali, Gasabo, Gisozi, Cell A, Muhima",
  "provinceId": 1,
  "districtId": 5,
  "sectorId": 12,
  "cellId": 45,
  "villageId": 120,
  "slaDeadline": "2026-04-11T08:30:45.123Z"
}
```

### Request Headers

```
POST /api/reports HTTP/1.1
Host: localhost:8081
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
Content-Length: 547
```

### Success Response (200 OK)

```json
{
  "message": "Report created successfully",
  "data": {
    "id": 45,
    "title": "Broken Water Pipe at Main Street",
    "description": "The main water pipe near the market is leaking...",
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

### Error Response (400 Bad Request)

```json
{
  "message": "Please select the full incident location up to village level.",
  "data": null,
  "success": false
}
```

---

## Database Record After Insertion

### SQL Query
```sql
SELECT * FROM reports WHERE id = 45;
```

### Result
```
id          | 45
title       | Broken Water Pipe at Main Street
description | The main water pipe near the market is leaking...
category    | Water                                    ← ✅ Populated
location    | Kigali, Gasabo, Gisozi, Cell A, Muhima  ← ✅ Populated
category_id | 1
incident_location_id | 120
province_id | 1
district_id | 5
sector_id   | 12
cell_id     | 45
village_id  | 120
sla_deadline| 2026-04-11 08:30:45                     ← ✅ Populated
status      | PENDING
created_at  | 2026-04-08 08:20:10
updated_at  | 2026-04-08 08:20:10
user_id     | 5
current_escalation_level | AT_VILLAGE
```

---

## Field Mappings

### Request DTO Fields → Database Columns

| Request Field | Type | Database Column | Database Type | Notes |
|---|---|---|---|---|
| `title` | string | `title` | VARCHAR(255) | Required |
| `description` | string | `description` | TEXT | Required |
| `categoryId` | number | `category_id` | INT | Required |
| `categoryName` | string | `category` | VARCHAR(100) | ✅ NEW - Maps to category column |
| `incidentLocationId` | number | `incident_location_id` | INT | Required |
| `incidentLocationName` | string | `location` | VARCHAR(500) | ✅ NEW - Maps to location column |
| `provinceId` | number | `province_id` | INT | Optional |
| `districtId` | number | `district_id` | INT | Optional |
| `sectorId` | number | `sector_id` | INT | Optional |
| `cellId` | number | `cell_id` | INT | Optional |
| `villageId` | number | `village_id` | INT | Optional |
| `slaDeadline` | string (ISO) | `sla_deadline` | DATETIME | Required - ISO format |

---

## Example Scenarios

### Scenario 1: Water Issue in Kigali
```json
{
  "title": "Water pipe burst",
  "description": "Main water line broken",
  "categoryId": 1,
  "categoryName": "Water",
  "incidentLocationId": 100,
  "incidentLocationName": "Kigali, Gasabo, Gisozi, Cell A, Village 1",
  "provinceId": 1,
  "districtId": 5,
  "sectorId": 12,
  "cellId": 45,
  "villageId": 100,
  "slaDeadline": "2026-04-11T08:30:45.123Z"
}
```

### Scenario 2: Electricity Issue in Muhanga
```json
{
  "title": "Frequent power outages",
  "description": "Power cuts every evening",
  "categoryId": 2,
  "categoryName": "Electricity",
  "incidentLocationId": 250,
  "incidentLocationName": "Muhanga, Rwamagana, Kabare, Cell B, Village 5",
  "provinceId": 3,
  "districtId": 15,
  "sectorId": 45,
  "cellId": 120,
  "villageId": 250,
  "slaDeadline": "2026-04-09T16:45:30.000Z"
}
```

### Scenario 3: Road Issue in Huye
```json
{
  "title": "Pothole on Main Road",
  "description": "Large pothole causing accidents",
  "categoryId": 3,
  "categoryName": "Roads",
  "incidentLocationId": 500,
  "incidentLocationName": "Huye, Huye City, Downtown, Cell C, Market Area",
  "provinceId": 2,
  "districtId": 10,
  "sectorId": 30,
  "cellId": 90,
  "villageId": 500,
  "slaDeadline": "2026-04-10T20:00:00.000Z"
}
```

---

## Category Options

```json
[
  { "id": 1, "name": "Water" },
  { "id": 2, "name": "Electricity" },
  { "id": 3, "name": "Roads" },
  { "id": 4, "name": "Security" },
  { "id": 5, "name": "Health" },
  { "id": 6, "name": "Other" }
]
```

---

## Valid SLA Deadline Formats

### Frontend generates (ISO 8601):
```
"2026-04-11T08:30:45.123Z"     ← What frontend sends
```

### Backend accepts & stores as LocalDateTime:
```
2026-04-11T08:30:45            ← Java LocalDateTime format
2026-04-11 08:30:45            ← MySQL DATETIME format
```

### Calculation:
```
Current Time: 2026-04-08 08:30:45
+ 72 hours (3 days)
= 2026-04-11 08:30:45
```

---

## TypeScript Types Reference

### Frontend DTO (TypeScript)
```typescript
interface CreateReportRequest extends AddressHierarchyRequest {
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;           // ← NEW
  incidentLocationId: number;
  incidentLocationName: string;   // ← NEW
  slaDeadline: string;            // ISO format
}

interface AddressHierarchyRequest {
  provinceId: number;
  districtId: number;
  sectorId: number;
  cellId: number;
  villageId: number;
}
```

### Backend DTO (Java)
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {
    private String title;
    private String description;
    private Integer categoryId;
    private String categoryName;            // ← NEW
    private Integer incidentLocationId;
    private String incidentLocationName;    // ← NEW
    private Integer provinceId;
    private Integer districtId;
    private Integer sectorId;
    private Integer cellId;
    private Integer villageId;
    private String slaDeadline;
}
```

---

## Error Responses

### Missing Category Selection
```json
{
  "message": "Please select a category",
  "success": false
}
```

### Missing Location Selection
```json
{
  "message": "Please select the full incident location up to village level.",
  "success": false
}
```

### Invalid SLA Deadline Format
```json
{
  "message": "Invalid SLA deadline format. Expected ISO 8601 format.",
  "success": false
}
```

### Database Error
```json
{
  "message": "Failed to create report: Database connection error",
  "success": false
}
```

---

## Testing the Payload

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:8081/api/reports`
3. **Headers**:
   ```
   Authorization: Bearer <your_jwt_token>
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "title": "Test Report",
     "description": "Testing the new categoryName and incidentLocationName fields",
     "categoryId": 1,
     "categoryName": "Water",
     "incidentLocationId": 120,
     "incidentLocationName": "Kigali, Gasabo, Gisozi, Cell A, Muhima",
     "provinceId": 1,
     "districtId": 5,
     "sectorId": 12,
     "cellId": 45,
     "villageId": 120,
     "slaDeadline": "2026-04-11T08:30:45.123Z"
   }
   ```
5. **Click Send**
6. **Expected Response**: 201 Created with report data

---

## Troubleshooting

### If `category` is NULL in database:
1. Check request body has `"categoryName"` field
2. Check DTO has `private String categoryName;`
3. Check Entity has mapping: `@Column(name = "category")`
4. Check Service sets it: `report.setCategory(request.getCategoryName());`

### If `location` is NULL in database:
1. Check request body has `"incidentLocationName"` field
2. Check DTO has `private String incidentLocationName;`
3. Check Entity has mapping: `@Column(name = "location")`
4. Check Service sets it: `report.setLocation(request.getIncidentLocationName());`

### If `sla_deadline` is NULL in database:
1. Check column exists: `ALTER TABLE reports ADD COLUMN sla_deadline DATETIME;`
2. Check request has `"slaDeadline"` in ISO format
3. Check Service parses it correctly: `LocalDateTime.parse(request.getSlaDeadline(), ...)`
4. Check Entity has correct mapping: `@Column(name = "sla_deadline")`

