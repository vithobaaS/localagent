package com.autopropel.localagent_cloud.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;

@Service
public class S3Service {

    @Value("${aws.s3.bucket:autopropel}")
    private String bucketName;

    @Value("${aws.region:ap-south-1}")
    private String region;

    @Value("${aws.access-key:}")
    private String accessKey;

    @Value("${aws.secret-key:}")
    private String secretKey;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (accessKey != null && !accessKey.isEmpty() && secretKey != null && !secretKey.isEmpty()) {
            s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        } else {
            // Fallback to default credentials provider (e.g. IAM role on EC2)
            s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .build();
        }
    }

    public String uploadImage(String fileName, byte[] imageBytes) {
        String key = "screenshots/" + fileName;
        
        PutObjectRequest putOb = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/png")
                .build();
                
        s3Client.putObject(putOb, RequestBody.fromBytes(imageBytes));
        
        // Return public URL (assuming bucket allows public read)
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
    }
}
