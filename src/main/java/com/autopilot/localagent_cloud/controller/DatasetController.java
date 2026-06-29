package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.Dataset;
import com.autopilot.localagent_cloud.repository.DatasetRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/datasets")
@CrossOrigin(origins = "*")
public class DatasetController {

    private final DatasetRepository datasetRepository;

    public DatasetController(DatasetRepository datasetRepository) {
        this.datasetRepository = datasetRepository;
    }

    private Long getOrgId(HttpServletRequest request) {
        Object o = request.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    // GET /api/datasets — list all datasets for org
    @GetMapping
    public ResponseEntity<List<Dataset>> getAll(HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(datasetRepository.findByOrgId(orgId));
    }

    // GET /api/datasets/{id} — get single dataset by id
    @GetMapping("/{id}")
    public ResponseEntity<Dataset> getById(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return datasetRepository.findById(id)
                .filter(d -> orgId.equals(d.getOrgId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/datasets — create dataset from JSON body
    @PostMapping
    public ResponseEntity<Dataset> create(@RequestBody Dataset dataset, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        dataset.setOrgId(orgId);
        return ResponseEntity.ok(datasetRepository.save(dataset));
    }

    // POST /api/datasets/upload — create dataset from CSV file upload
    @PostMapping("/upload")
    public ResponseEntity<?> uploadCsv(@RequestParam("file") MultipartFile file,
                                       @RequestParam("name") String name,
                                       HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            List<String[]> allRows = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    allRows.add(parseCsvLine(line));
                }
            }

            if (allRows.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "CSV file is empty"));
            }

            String[] headerRow = allRows.get(0);
            List<String[]> dataRows = allRows.subList(1, allRows.size());

            String headersJson = toJsonArray(headerRow);
            String rowsJson = toJsonArrayOfArrays(dataRows);

            Dataset dataset = new Dataset();
            dataset.setOrgId(orgId);
            dataset.setName(name);
            dataset.setHeaders(headersJson);
            dataset.setRows(rowsJson);
            dataset.setRowCount(dataRows.size());

            return ResponseEntity.ok(datasetRepository.save(dataset));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to parse CSV: " + e.getMessage()));
        }
    }

    // PUT /api/datasets/{id} — update dataset
    @PutMapping("/{id}")
    public ResponseEntity<Dataset> update(@PathVariable Long id,
                                          @RequestBody Dataset body,
                                          HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return datasetRepository.findById(id)
                .filter(d -> orgId.equals(d.getOrgId()))
                .map(d -> {
                    if (body.getName() != null) d.setName(body.getName());
                    if (body.getDescription() != null) d.setDescription(body.getDescription());
                    if (body.getHeaders() != null) d.setHeaders(body.getHeaders());
                    if (body.getRows() != null) d.setRows(body.getRows());
                    if (body.getRowCount() != null) d.setRowCount(body.getRowCount());
                    return ResponseEntity.ok(datasetRepository.save(d));
                }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/datasets/{id} — delete dataset
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return datasetRepository.findById(id)
                .filter(d -> orgId.equals(d.getOrgId()))
                .map(d -> { datasetRepository.delete(d); return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- CSV Parsing Helpers ---

    /**
     * Parses a single CSV line, handling quoted fields that may contain commas.
     */
    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    // Check for escaped quote ""
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    fields.add(current.toString().trim());
                    current = new StringBuilder();
                } else {
                    current.append(c);
                }
            }
        }
        fields.add(current.toString().trim());
        return fields.toArray(new String[0]);
    }

    /**
     * Converts a String array to a JSON array string, e.g. ["a","b","c"]
     */
    private String toJsonArray(String[] items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.length; i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(items[i])).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Converts a list of String arrays to a JSON array of arrays string.
     */
    private String toJsonArrayOfArrays(List<String[]> rows) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(toJsonArray(rows.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Escapes special characters for JSON string values.
     */
    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
