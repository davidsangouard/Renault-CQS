-- CQS — Checklist Qualité Soudure
-- Schéma normalisé — aucune redondance, aucun blob JSON

CREATE DATABASE IF NOT EXISTS `cqs_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cqs_db`;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. IPNs (opérateurs + managers)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ipns` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `ipn`        VARCHAR(50)  NOT NULL,
  `is_manager` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ipn` (`ipn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Projets (CEV, X82…)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projets` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(50)  NOT NULL,
  `label`      VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Organes (BAR, BAV, TAR…)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `organes` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `projet_id`  INT          NOT NULL,
  `code`       VARCHAR(50)  NOT NULL,
  `label`      VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_projet_code` (`projet_id`, `code`),
  CONSTRAINT `fk_org_projet` FOREIGN KEY (`projet_id`)
    REFERENCES `projets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Opérations (OP 80, OP 110…)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `operations` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `organe_id`  INT          NOT NULL,
  `op_key`     VARCHAR(50)  NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_org_op` (`organe_id`, `op_key`),
  CONSTRAINT `fk_op_organe` FOREIGN KEY (`organe_id`)
    REFERENCES `organes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Cordons (C260, C261… par opération)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cordons` (
  `id`           INT  NOT NULL AUTO_INCREMENT,
  `operation_id` INT  NOT NULL,
  `numero`       INT  NOT NULL,
  `sort_order`   INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_op_num` (`operation_id`, `numero`),
  CONSTRAINT `fk_cordon_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Pièces (« Tôle latérale D »… par opération)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pieces` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `operation_id` INT          NOT NULL,
  `label`        VARCHAR(200) NOT NULL,
  `sort_order`   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_piece_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Sous-ensembles requis par opération (« OP 80 » requis par « OP 110 »)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `op_sous_ensembles` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `operation_id` INT          NOT NULL,
  `ref_label`    VARCHAR(50)  NOT NULL,
  `sort_order`   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_se_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Ordres de fabrication
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ordres_fabrication` (
  `of_number`  VARCHAR(100) NOT NULL,
  `organe_id`  INT          NOT NULL,
  `of_date`    VARCHAR(20)  DEFAULT '',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`of_number`),
  CONSTRAINT `fk_of_organe` FOREIGN KEY (`organe_id`)
    REFERENCES `organes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Vérifications par opération par OF
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `op_verifications` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `of_number`    VARCHAR(100) NOT NULL,
  `operation_id` INT          NOT NULL,
  `status`       ENUM('todo','inprogress','done','nok') DEFAULT 'todo',
  `piece_num`    VARCHAR(200) DEFAULT '',
  `ipn`          VARCHAR(50)  DEFAULT '',
  `conformite`   VARCHAR(20)  DEFAULT NULL,
  `commentaire`  TEXT,
  `updated_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_of_op` (`of_number`, `operation_id`),
  CONSTRAINT `fk_ov_of`  FOREIGN KEY (`of_number`)
    REFERENCES `ordres_fabrication` (`of_number`) ON DELETE CASCADE,
  CONSTRAINT `fk_ov_op`  FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Vérifications par cordon
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cordon_verifications` (
  `id`          INT                   NOT NULL AUTO_INCREMENT,
  `op_verif_id` INT                   NOT NULL,
  `cordon_id`   INT                   NOT NULL,
  `statut`      ENUM('ok','nok')      DEFAULT 'ok',
  `retouche`    TINYINT(1)            DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verif_cordon` (`op_verif_id`, `cordon_id`),
  CONSTRAINT `fk_cv_ov`     FOREIGN KEY (`op_verif_id`)
    REFERENCES `op_verifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cv_cordon` FOREIGN KEY (`cordon_id`)
    REFERENCES `cordons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Vérifications par sous-ensemble
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sous_ensemble_verifications` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `op_verif_id`      INT          NOT NULL,
  `sous_ensemble_id` INT          NOT NULL,
  `num_d`            VARCHAR(200) DEFAULT '',
  `num_g`            VARCHAR(200) DEFAULT '',
  `retouche_d`       TINYINT(1)   DEFAULT 0,
  `retouche_g`       TINYINT(1)   DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verif_se` (`op_verif_id`, `sous_ensemble_id`),
  CONSTRAINT `fk_sev_ov` FOREIGN KEY (`op_verif_id`)
    REFERENCES `op_verifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sev_se` FOREIGN KEY (`sous_ensemble_id`)
    REFERENCES `op_sous_ensembles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- Données initiales
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `ipns` (`ipn`, `is_manager`) VALUES
  ('ADMIN',  1),
  ('CHEF01', 1),
  ('QUAL01', 1);

INSERT IGNORE INTO `projets` (`code`, `label`, `sort_order`) VALUES
  ('cev', 'CEV', 1),
  ('x82', 'X82', 2);

INSERT IGNORE INTO `organes` (`projet_id`, `code`, `label`, `sort_order`) VALUES
  ((SELECT id FROM projets WHERE code='cev'), 'cev-bar', 'BAR', 1),
  ((SELECT id FROM projets WHERE code='cev'), 'cev-bav', 'BAV', 2),
  ((SELECT id FROM projets WHERE code='x82'), 'x82-tar', 'TAR', 1),
  ((SELECT id FROM projets WHERE code='x82'), 'x82-bav', 'BAV', 2);
