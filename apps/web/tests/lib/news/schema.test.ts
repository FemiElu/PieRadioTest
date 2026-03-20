import { describe, it, expect } from 'vitest';
import { CreateArticleSchema, UpdateArticleSchema } from '@/lib/news/schema';

describe('News Schema Validation', () => {
    describe('CreateArticleSchema', () => {
        it('should validate a correct minimal article', () => {
            const validData = {
                title: 'Test Article',
                slug: 'test-article',
                content: '# Hello\nThis is a test article.',
                tier: 'update',
                status: 'draft',
                is_breaking: false,
            };

            const result = CreateArticleSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty title', () => {
            const data = {
                title: '',
                slug: 'test-article',
                content: 'content',
            };
            const result = CreateArticleSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('at least 3 characters');
            }
        });

        it('should reject invalid slug', () => {
            const data = {
                title: 'Test Article',
                slug: 'Invalid Slug!',
                content: 'content',
            };
            const result = CreateArticleSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('lowercase letters, numbers, and hyphens');
            }
        });

        it('should validate valid audio moments', () => {
            const data = {
                title: 'Test Article',
                slug: 'test-article',
                content: 'content',
                audio_moments: [
                    { label: 'Intro', time_seconds: 0 },
                    { label: 'Middle', time_seconds: 120 },
                ]
            };
            const result = CreateArticleSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid audio moments (negative time)', () => {
             const data = {
                title: 'Test Article',
                slug: 'test-article',
                content: 'content',
                audio_moments: [
                    { label: 'Intro', time_seconds: -10 },
                ]
            };
            const result = CreateArticleSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('UpdateArticleSchema', () => {
        it('should allow partial updates', () => {
            const data = {
                title: 'Updated Title',
            };
            const result = UpdateArticleSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should still enforce validation rules on provided fields', () => {
            const data = {
                title: 'A', // Too short
            };
            const result = UpdateArticleSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
        
        it('should allow status update', () => {
            const data = {
                status: 'published',
            };
            const result = UpdateArticleSchema.safeParse(data);
             expect(result.success).toBe(true);
        });
    });
});
