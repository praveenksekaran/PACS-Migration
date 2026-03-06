CREATE TABLE IF NOT EXISTS studies (
  id                       SERIAL PRIMARY KEY,
  study_instance_uid       VARCHAR(64)  UNIQUE NOT NULL,
  patient_id               VARCHAR(64),
  patient_name             VARCHAR(256),
  patient_birth_date       VARCHAR(8),
  patient_sex              VARCHAR(16),
  study_date               VARCHAR(8),
  study_time               VARCHAR(16),
  accession_number         VARCHAR(64),
  study_id                 VARCHAR(16),
  referring_physician_name VARCHAR(256),
  created_at               TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series (
  id                  SERIAL PRIMARY KEY,
  series_instance_uid VARCHAR(64)  UNIQUE NOT NULL,
  study_instance_uid  VARCHAR(64)  NOT NULL REFERENCES studies(study_instance_uid) ON DELETE CASCADE,
  modality            VARCHAR(16),
  series_description  VARCHAR(256),
  series_number       INTEGER,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instances (
  id                         SERIAL PRIMARY KEY,
  sop_instance_uid           VARCHAR(64)  UNIQUE NOT NULL,
  series_instance_uid        VARCHAR(64)  NOT NULL REFERENCES series(series_instance_uid) ON DELETE CASCADE,
  study_instance_uid         VARCHAR(64)  NOT NULL REFERENCES studies(study_instance_uid) ON DELETE CASCADE,
  sop_class_uid              VARCHAR(64),
  samples_per_pixel          INTEGER,
  photometric_interpretation VARCHAR(16),
  rows                       INTEGER,
  columns                    INTEGER,
  pixel_spacing              VARCHAR(64),
  bits_allocated             INTEGER,
  bits_stored                INTEGER,
  high_bit                   INTEGER,
  pixel_representation       INTEGER,
  window_center              VARCHAR(64),
  window_width               VARCHAR(64),
  rescale_intercept          VARCHAR(64),
  rescale_slope              VARCHAR(64),
  image_position_patient     VARCHAR(128),
  image_orientation_patient  VARCHAR(256),
  file_path                  VARCHAR(512),
  created_at                 TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studies_study_date  ON studies(study_date);
CREATE INDEX IF NOT EXISTS idx_studies_patient_id  ON studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_series_study_uid    ON series(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_inst_series_uid     ON instances(series_instance_uid);
CREATE INDEX IF NOT EXISTS idx_inst_study_uid      ON instances(study_instance_uid);
