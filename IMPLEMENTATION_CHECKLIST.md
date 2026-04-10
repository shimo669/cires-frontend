# 🚀 Quick Implementation Checklist

## Frontend Status: ✅ COMPLETE

- [x] Updated `GeographyDropdowns.tsx` to emit location names
- [x] Updated `SubmitReport.tsx` to capture category name
- [x] Updated `SubmitReport.tsx` to build full location string
- [x] Updated `src/types/report.ts` to include new fields
- [x] Updated `src/types/geo.ts` with address hierarchy with names
- [x] Form validation ensures all address levels are selected
- [x] Sends payload with: `categoryName`, `incidentLocationName`, all IDs, and `slaDeadline`

**Frontend now sends:**
```json
{
  "title": "...",
  "description": "...",
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

---

## Backend To-Do: ⏳ PENDING

### Step 1: Update DTOs
- [ ] Add `categoryName: String` to `CreateReportRequest`
- [ ] Add `incidentLocationName: String` to `CreateReportRequest`
- [ ] Add `provinceId`, `districtId`, `sectorId`, `cellId`, `villageId` to `CreateReportRequest`

**File**: `CreateReportRequest.java`

### Step 2: Update Database Schema
- [ ] Add column: `ALTER TABLE reports ADD COLUMN category VARCHAR(100);`
- [ ] Add column: `ALTER TABLE reports ADD COLUMN location VARCHAR(500);`
- [ ] Add columns: `province_id`, `district_id`, `sector_id`, `cell_id`, `village_id`
- [ ] Verify column: `sla_deadline` exists and is type `DATETIME` or `TIMESTAMP`

**Run SQL Migration** or execute directly

### Step 3: Update Report Entity
- [ ] Add field: `private String category;`
- [ ] Add field: `private String location;`
- [ ] Add fields for address hierarchy IDs
- [ ] Map all fields with `@Column` annotations
- [ ] Ensure `slaDeadline` maps to correct column name

**File**: `Report.java`

### Step 4: Update ReportService
- [ ] Set `report.setCategory(request.getCategoryName());`
- [ ] Set `report.setLocation(request.getIncidentLocationName());`
- [ ] Parse and set `report.setSlaDeadline(LocalDateTime.parse(request.getSlaDeadline(), ...));`
- [ ] Set all address hierarchy fields
- [ ] Add logging to track the data flow

**File**: `ReportService.java` → `createReport()` method

### Step 5: Test the Integration
- [ ] Deploy backend changes
- [ ] Open frontend and submit a report
- [ ] Check browser DevTools Network tab → verify POST body
- [ ] Check database → verify all 3 fields are populated (Category, Location, SLA Deadline)
- [ ] Check API response → should return the saved report with all fields

---

## Files You Need to Modify (Backend)

| File | Changes |
|------|---------|
| `CreateReportRequest.java` | Add `categoryName`, `incidentLocationName` and address hierarchy fields |
| `Report.java` | Add `category`, `location` columns and address hierarchy fields |
| `ReportService.java` | Update `createReport()` to set the new fields |
| `ReportController.java` | (Optional) Add validation annotations to DTO |
| `database/migration/V*.sql` | Run SQL to add columns |

---

## Testing Commands

### 1. Test with cURL (After Backend Deployment)

```bash
curl -X POST http://localhost:8081/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report",
    "description": "This is a test",
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
  }'
```

### 2. Query Database to Verify

```sql
SELECT id, title, category, location, sla_deadline, status, created_at 
FROM reports 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result**: All three fields populated with values (NOT NULL)

### 3. Check Application Logs

```bash
grep -i "Creating report" your_app.log
grep -i "Category:" your_app.log
grep -i "Location:" your_app.log
```

You should see log entries with the category name and location string.

---

## Common Pitfalls to Avoid

❌ **Don't forget**:
- [ ] Don't forget to add `@Transactional` to your service method
- [ ] Don't forget to run database migrations before deploying code
- [ ] Don't forget to add `@CurrentUser` annotation to get the authenticated user
- [ ] Don't forget the Lombok annotations (`@Data`, `@AllArgsConstructor`, `@NoArgsConstructor`)

❌ **Don't use wrong types**:
- Use `LocalDateTime` for `slaDeadline`, not `Date` or `String`
- Use `DateTimeFormatter.ISO_DATE_TIME` for parsing

❌ **Don't map to wrong columns**:
- `categoryName` → `category` column
- `incidentLocationName` → `location` column
- NOT the other way around!

---

## Support

If you run into any issues:

1. **Category/Location still NULL?**
   - Check: Does the DTO receive the values? (add logging)
   - Check: Does the Service set them? (add logging)
   - Check: Do the Entity annotations match the column names?

2. **SLA Deadline parse error?**
   - Frontend sends: `"2026-04-11T08:30:45.123Z"` (ISO format)
   - Backend must parse it as: `LocalDateTime.parse(isoString, DateTimeFormatter.ISO_DATE_TIME)`
   - Store as: `LocalDateTime` in database

3. **Missing columns in database?**
   - Run the migration SQL provided in `BACKEND_CODE_EXAMPLES.md`
   - Or manually: `ALTER TABLE reports ADD COLUMN category VARCHAR(100);`

---

## Progress Tracker

**Frontend**: ✅ 100% Complete
- [x] Captures category name from dropdown
- [x] Builds location string from geography picker
- [x] Sends categoryName in payload
- [x] Sends incidentLocationName in payload
- [x] Sends all address hierarchy IDs

**Backend**: ⏳ Pending (Your Turn!)
- [ ] Update DTO to accept new fields
- [ ] Update Entity to store new fields
- [ ] Update Service to save new fields
- [ ] Update Database schema with new columns
- [ ] Test end-to-end

---

## Next Steps

1. **Take the `BACKEND_CODE_EXAMPLES.md` file and copy-paste the code** into your project
2. **Run the SQL migration** to add the missing columns
3. **Deploy** your backend changes
4. **Test** by submitting a report from the frontend
5. **Verify** in the database that Category, Location, and SLA Deadline are populated

That's it! You're done! 🎉

---

**Questions?** Check the detailed documentation files:
- `FRONTEND_FIXES_AND_BACKEND_REQUIREMENTS.md` - Full explanation
- `BACKEND_CODE_EXAMPLES.md` - Copy-paste ready code
- `Frontend_to_Backend_Data_Flow.md` - Visual data flow

