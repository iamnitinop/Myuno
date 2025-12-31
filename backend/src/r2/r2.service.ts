import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
    private client: S3Client;
    private bucket = process.env.R2_BUCKET!;
    private publicBaseUrl = process.env.R2_PUBLIC_BASE_URL!;

    constructor() {
        this.client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async putJson(key: string, data: any, cacheSeconds = 60) {
        const body = JSON.stringify(data);

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: 'application/json; charset=utf-8',
                CacheControl: `public, max-age=${cacheSeconds}`,
            }),
        );

        return { key, url: `${this.publicBaseUrl}/${key}` };
    }
}
