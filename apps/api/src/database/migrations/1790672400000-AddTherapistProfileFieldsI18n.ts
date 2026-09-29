import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistProfileFieldsI18n1790672400000 implements MigrationInterface {
  name = 'AddTherapistProfileFieldsI18n1790672400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.insertResources(queryRunner, 'vi', [
      ['therapistProfile', 'form.gender.label', 'Giới tính'],
      ['therapistProfile', 'form.gender.unknown', 'Chưa xác định'],
      ['therapistProfile', 'form.gender.male', 'Nam'],
      ['therapistProfile', 'form.gender.female', 'Nữ'],
      ['therapistProfile', 'form.gender.other', 'Khác'],
      ['therapistProfile', 'form.dateOfBirth.label', 'Ngày sinh'],
      ['therapistProfile', 'form.address.label', 'Địa chỉ'],
      ['therapistProfile', 'form.address.placeholder', 'Nhập địa chỉ hiện tại'],
      [
        'therapistProfile',
        'form.address.maxLength',
        'Địa chỉ không được vượt quá 2000 ký tự',
      ],
      ['therapistProfile', 'form.stageName.label', 'Nghệ danh'],
      [
        'therapistProfile',
        'form.stageName.placeholder',
        'Nhập nghệ danh nếu có',
      ],
      [
        'therapistProfile',
        'form.stageName.maxLength',
        'Nghệ danh không được vượt quá 255 ký tự',
      ],
      ['therapistProfile', 'form.hasTattoo.label', 'Có hình xăm'],
      ['therapistProfile', 'form.hasTattoo.yes', 'Có'],
      ['therapistProfile', 'form.hasTattoo.no', 'Không'],

      ['auth', 'register.therapistProfile.title', 'Thông tin kỹ thuật viên'],
      [
        'auth',
        'register.therapistProfile.description',
        'Thông tin này giúp khách hàng hiểu rõ hơn về bạn.',
      ],
      ['auth', 'register.therapistProfile.gender.label', 'Giới tính'],
      ['auth', 'register.therapistProfile.gender.unknown', 'Chưa xác định'],
      ['auth', 'register.therapistProfile.gender.male', 'Nam'],
      ['auth', 'register.therapistProfile.gender.female', 'Nữ'],
      ['auth', 'register.therapistProfile.gender.other', 'Khác'],
      ['auth', 'register.therapistProfile.dateOfBirth', 'Ngày sinh'],
      ['auth', 'register.therapistProfile.address.label', 'Địa chỉ'],
      [
        'auth',
        'register.therapistProfile.address.placeholder',
        'Nhập địa chỉ hiện tại',
      ],
      ['auth', 'register.therapistProfile.stageName.label', 'Nghệ danh'],
      [
        'auth',
        'register.therapistProfile.stageName.placeholder',
        'Nhập nghệ danh nếu có',
      ],
      [
        'auth',
        'register.therapistProfile.experienceYears',
        'Số năm kinh nghiệm',
      ],
      ['auth', 'register.therapistProfile.hasTattoo', 'Có hình xăm'],
    ]);

    await this.insertResources(queryRunner, 'en', [
      ['therapistProfile', 'form.gender.label', 'Gender'],
      ['therapistProfile', 'form.gender.unknown', 'Not specified'],
      ['therapistProfile', 'form.gender.male', 'Male'],
      ['therapistProfile', 'form.gender.female', 'Female'],
      ['therapistProfile', 'form.gender.other', 'Other'],
      ['therapistProfile', 'form.dateOfBirth.label', 'Date of birth'],
      ['therapistProfile', 'form.address.label', 'Address'],
      [
        'therapistProfile',
        'form.address.placeholder',
        'Enter your current address',
      ],
      [
        'therapistProfile',
        'form.address.maxLength',
        'Address must not exceed 2000 characters',
      ],
      ['therapistProfile', 'form.stageName.label', 'Stage name'],
      [
        'therapistProfile',
        'form.stageName.placeholder',
        'Enter your stage name if applicable',
      ],
      [
        'therapistProfile',
        'form.stageName.maxLength',
        'Stage name must not exceed 255 characters',
      ],
      ['therapistProfile', 'form.hasTattoo.label', 'Tattoo'],
      ['therapistProfile', 'form.hasTattoo.yes', 'Yes'],
      ['therapistProfile', 'form.hasTattoo.no', 'No'],

      ['auth', 'register.therapistProfile.title', 'Therapist information'],
      [
        'auth',
        'register.therapistProfile.description',
        'This information helps customers learn more about you.',
      ],
      ['auth', 'register.therapistProfile.gender.label', 'Gender'],
      ['auth', 'register.therapistProfile.gender.unknown', 'Not specified'],
      ['auth', 'register.therapistProfile.gender.male', 'Male'],
      ['auth', 'register.therapistProfile.gender.female', 'Female'],
      ['auth', 'register.therapistProfile.gender.other', 'Other'],
      ['auth', 'register.therapistProfile.dateOfBirth', 'Date of birth'],
      ['auth', 'register.therapistProfile.address.label', 'Address'],
      [
        'auth',
        'register.therapistProfile.address.placeholder',
        'Enter your current address',
      ],
      ['auth', 'register.therapistProfile.stageName.label', 'Stage name'],
      [
        'auth',
        'register.therapistProfile.stageName.placeholder',
        'Enter your stage name if applicable',
      ],
      [
        'auth',
        'register.therapistProfile.experienceYears',
        'Years of experience',
      ],
      ['auth', 'register.therapistProfile.hasTattoo', 'Tattoo'],
    ]);

    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" = "revision" + 1,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "code" IN ('vi', 'en')
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM "i18n_resources"
        WHERE
          (
            "namespace" = 'therapistProfile'
            AND "key" IN (
              'form.gender.label',
              'form.gender.unknown',
              'form.gender.male',
              'form.gender.female',
              'form.gender.other',
              'form.dateOfBirth.label',
              'form.address.label',
              'form.address.placeholder',
              'form.address.maxLength',
              'form.stageName.label',
              'form.stageName.placeholder',
              'form.stageName.maxLength',
              'form.hasTattoo.label',
              'form.hasTattoo.yes',
              'form.hasTattoo.no'
            )
          )
          OR
          (
            "namespace" = 'auth'
            AND "key" IN (
              'register.therapistProfile.title',
              'register.therapistProfile.description',
              'register.therapistProfile.gender.label',
              'register.therapistProfile.gender.unknown',
              'register.therapistProfile.gender.male',
              'register.therapistProfile.gender.female',
              'register.therapistProfile.gender.other',
              'register.therapistProfile.dateOfBirth',
              'register.therapistProfile.address.label',
              'register.therapistProfile.address.placeholder',
              'register.therapistProfile.stageName.label',
              'register.therapistProfile.stageName.placeholder',
              'register.therapistProfile.experienceYears',
              'register.therapistProfile.hasTattoo'
            )
          )
      `);

    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" = "revision" + 1,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "code" IN ('vi', 'en')
      `);
  }

  private async insertResources(
    queryRunner: QueryRunner,
    languageCode: string,
    resources: Array<[namespace: string, key: string, value: string]>,
  ) {
    for (const [namespace, key, value] of resources) {
      await queryRunner.query(
        `
            INSERT INTO "i18n_resources"
            (
              "language_id",
              "namespace",
              "key",
              "value"
            )
            SELECT
              "id",
              $2,
              $3,
              $4
            FROM "i18n_languages"
            WHERE
              "code" = $1
              AND "is_active" = true
            ON CONFLICT (
              "language_id",
              "namespace",
              "key"
            )
            DO UPDATE SET
              "value" = EXCLUDED."value",
              "updated_at" = CURRENT_TIMESTAMP,
              "deleted_at" = NULL
          `,
        [languageCode, namespace, key, value],
      );
    }
  }
}
