-- CQS — Checklist Qualité Soudure
-- Schéma normalisé + données initiales complètes
-- Import phpMyAdmin : File → Import → ce fichier (aucune procédure stockée)

CREATE DATABASE IF NOT EXISTS `cqs_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cqs_db`;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `ipns` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `ipn`        VARCHAR(50) NOT NULL,
  `is_manager` TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ipn` (`ipn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `projets` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(50)  NOT NULL,
  `label`      VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `organes` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `projet_id`  INT          NOT NULL,
  `code`       VARCHAR(50)  NOT NULL,
  `label`      VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_projet_code` (`projet_id`, `code`),
  CONSTRAINT `fk_org_projet` FOREIGN KEY (`projet_id`)
    REFERENCES `projets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `operations` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `organe_id`  INT         NOT NULL,
  `op_key`     VARCHAR(50) NOT NULL,
  `sort_order` INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_org_op` (`organe_id`, `op_key`),
  CONSTRAINT `fk_op_organe` FOREIGN KEY (`organe_id`)
    REFERENCES `organes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cordons` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `operation_id` INT NOT NULL,
  `numero`       INT NOT NULL,
  `sort_order`   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_op_num` (`operation_id`, `numero`),
  CONSTRAINT `fk_cordon_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pieces` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `operation_id` INT          NOT NULL,
  `label`        VARCHAR(200) NOT NULL,
  `sort_order`   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_piece_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `op_sous_ensembles` (
  `id`           INT         NOT NULL AUTO_INCREMENT,
  `operation_id` INT         NOT NULL,
  `ref_label`    VARCHAR(50) NOT NULL,
  `sort_order`   INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_se_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  CONSTRAINT `fk_ov_of` FOREIGN KEY (`of_number`)
    REFERENCES `ordres_fabrication` (`of_number`) ON DELETE CASCADE,
  CONSTRAINT `fk_ov_op` FOREIGN KEY (`operation_id`)
    REFERENCES `operations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cordon_verifications` (
  `id`          INT              NOT NULL AUTO_INCREMENT,
  `op_verif_id` INT              NOT NULL,
  `cordon_id`   INT              NOT NULL,
  `statut`      ENUM('ok','nok') DEFAULT 'ok',
  `retouche`    TINYINT(1)       DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verif_cordon` (`op_verif_id`, `cordon_id`),
  CONSTRAINT `fk_cv_ov`     FOREIGN KEY (`op_verif_id`)
    REFERENCES `op_verifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cv_cordon` FOREIGN KEY (`cordon_id`)
    REFERENCES `cordons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
-- IPNs, projets, organes
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Opérations — CROSS JOIN : insère les 16 OPs pour chacun des 4 organes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `operations` (`organe_id`, `op_key`, `sort_order`)
SELECT o.id, t.op_key, t.sort_order
FROM `organes` o
CROSS JOIN (
  SELECT 'OP 80'      AS op_key,  0 AS sort_order UNION ALL
  SELECT 'OP 110',                1 UNION ALL
  SELECT 'OP 140',                2 UNION ALL
  SELECT 'OP 150',                3 UNION ALL
  SELECT 'OP 210_1',              4 UNION ALL
  SELECT 'OP 210_2',              5 UNION ALL
  SELECT 'OP 250_1',              6 UNION ALL
  SELECT 'OP 250_2WS',            7 UNION ALL
  SELECT 'OP 250_3',              8 UNION ALL
  SELECT 'OP 260_1',              9 UNION ALL
  SELECT 'OP 260_2',             10 UNION ALL
  SELECT 'OP 260_3',             11 UNION ALL
  SELECT 'OP 260_4',             12 UNION ALL
  SELECT 'OP 260_5',             13 UNION ALL
  SELECT 'OP 260_6',             14 UNION ALL
  SELECT 'OP 260_7',             15
) t;

-- ─────────────────────────────────────────────────────────────────────────────
-- Cordons — INNER JOIN sur op_key : insère pour tous les organes d'un coup
-- ─────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `cordons` (`operation_id`, `numero`, `sort_order`)
SELECT op.id, c.numero, c.sort_order
FROM `operations` op
INNER JOIN (
  -- OP 80
  SELECT 'OP 80' AS op_key, 260 AS numero,  0 AS sort_order UNION ALL
  SELECT 'OP 80', 261,  1 UNION ALL
  SELECT 'OP 80', 262,  2 UNION ALL
  SELECT 'OP 80', 263,  3 UNION ALL
  -- OP 110
  SELECT 'OP 110', 100,  0 UNION ALL
  SELECT 'OP 110', 101,  1 UNION ALL
  SELECT 'OP 110', 102,  2 UNION ALL
  SELECT 'OP 110', 103,  3 UNION ALL
  SELECT 'OP 110', 164,  4 UNION ALL
  SELECT 'OP 110', 165,  5 UNION ALL
  SELECT 'OP 110', 166,  6 UNION ALL
  SELECT 'OP 110', 167,  7 UNION ALL
  SELECT 'OP 110', 168,  8 UNION ALL
  SELECT 'OP 110', 169,  9 UNION ALL
  SELECT 'OP 110',  22, 10 UNION ALL
  SELECT 'OP 110',  23, 11 UNION ALL
  -- OP 140
  SELECT 'OP 140', 308,  0 UNION ALL
  SELECT 'OP 140', 309,  1 UNION ALL
  SELECT 'OP 140', 304,  2 UNION ALL
  SELECT 'OP 140', 305,  3 UNION ALL
  SELECT 'OP 140', 334,  4 UNION ALL
  SELECT 'OP 140', 335,  5 UNION ALL
  SELECT 'OP 140', 312,  6 UNION ALL
  SELECT 'OP 140', 313,  7 UNION ALL
  SELECT 'OP 140', 270,  8 UNION ALL
  SELECT 'OP 140', 271,  9 UNION ALL
  -- OP 150
  SELECT 'OP 150',  30,  0 UNION ALL
  SELECT 'OP 150',  31,  1 UNION ALL
  SELECT 'OP 150',  32,  2 UNION ALL
  SELECT 'OP 150',  33,  3 UNION ALL
  SELECT 'OP 150', 350,  4 UNION ALL
  SELECT 'OP 150', 351,  5 UNION ALL
  SELECT 'OP 150',  36,  6 UNION ALL
  SELECT 'OP 150',  37,  7 UNION ALL
  SELECT 'OP 150',  38,  8 UNION ALL
  SELECT 'OP 150',  39,  9 UNION ALL
  SELECT 'OP 150', 365, 10 UNION ALL
  SELECT 'OP 150', 352, 11 UNION ALL
  SELECT 'OP 150', 353, 12 UNION ALL
  SELECT 'OP 150',  10, 13 UNION ALL
  SELECT 'OP 150',  11, 14 UNION ALL
  SELECT 'OP 150',  14, 15 UNION ALL
  SELECT 'OP 150',  15, 16 UNION ALL
  -- OP 210_1
  SELECT 'OP 210_1', 180,  0 UNION ALL
  SELECT 'OP 210_1', 181,  1 UNION ALL
  SELECT 'OP 210_1',  52,  2 UNION ALL
  SELECT 'OP 210_1',  53,  3 UNION ALL
  SELECT 'OP 210_1', 132,  4 UNION ALL
  SELECT 'OP 210_1', 133,  5 UNION ALL
  SELECT 'OP 210_1', 140,  6 UNION ALL
  SELECT 'OP 210_1', 141,  7 UNION ALL
  SELECT 'OP 210_1',  64,  8 UNION ALL
  SELECT 'OP 210_1',  65,  9 UNION ALL
  SELECT 'OP 210_1', 142, 10 UNION ALL
  SELECT 'OP 210_1', 143, 11 UNION ALL
  SELECT 'OP 210_1',  68, 12 UNION ALL
  SELECT 'OP 210_1',  69, 13 UNION ALL
  SELECT 'OP 210_1', 182, 14 UNION ALL
  SELECT 'OP 210_1', 183, 15 UNION ALL
  SELECT 'OP 210_1', 200, 16 UNION ALL
  SELECT 'OP 210_1', 201, 17 UNION ALL
  SELECT 'OP 210_1', 208, 18 UNION ALL
  SELECT 'OP 210_1', 209, 19 UNION ALL
  SELECT 'OP 210_1', 206, 20 UNION ALL
  SELECT 'OP 210_1', 207, 21 UNION ALL
  -- OP 210_2
  SELECT 'OP 210_2', 336,  0 UNION ALL
  SELECT 'OP 210_2', 337,  1 UNION ALL
  SELECT 'OP 210_2', 190,  2 UNION ALL
  SELECT 'OP 210_2', 191,  3 UNION ALL
  SELECT 'OP 210_2',  66,  4 UNION ALL
  SELECT 'OP 210_2',  67,  5 UNION ALL
  SELECT 'OP 210_2',  54,  6 UNION ALL
  SELECT 'OP 210_2',  55,  7 UNION ALL
  SELECT 'OP 210_2',  56,  8 UNION ALL
  SELECT 'OP 210_2',  57,  9 UNION ALL
  SELECT 'OP 210_2', 202, 10 UNION ALL
  SELECT 'OP 210_2', 203, 11 UNION ALL
  -- OP 250_1
  SELECT 'OP 250_1',  74,  0 UNION ALL
  SELECT 'OP 250_1',  75,  1 UNION ALL
  SELECT 'OP 250_1',  72,  2 UNION ALL
  SELECT 'OP 250_1',  73,  3 UNION ALL
  SELECT 'OP 250_1',  76,  4 UNION ALL
  SELECT 'OP 250_1',  77,  5 UNION ALL
  SELECT 'OP 250_1',  78,  6 UNION ALL
  SELECT 'OP 250_1',  79,  7 UNION ALL
  SELECT 'OP 250_1',  80,  8 UNION ALL
  SELECT 'OP 250_1',  81,  9 UNION ALL
  SELECT 'OP 250_1',  90, 10 UNION ALL
  SELECT 'OP 250_1',  91, 11 UNION ALL
  SELECT 'OP 250_1',  92, 12 UNION ALL
  SELECT 'OP 250_1',  93, 13 UNION ALL
  SELECT 'OP 250_1',  42, 14 UNION ALL
  SELECT 'OP 250_1',  43, 15 UNION ALL
  -- OP 250_2WS
  SELECT 'OP 250_2WS', 284,  0 UNION ALL
  SELECT 'OP 250_2WS', 285,  1 UNION ALL
  SELECT 'OP 250_2WS', 282,  2 UNION ALL
  SELECT 'OP 250_2WS', 283,  3 UNION ALL
  SELECT 'OP 250_2WS', 288,  4 UNION ALL
  SELECT 'OP 250_2WS', 289,  5 UNION ALL
  SELECT 'OP 250_2WS', 290,  6 UNION ALL
  SELECT 'OP 250_2WS', 291,  7 UNION ALL
  SELECT 'OP 250_2WS', 294,  8 UNION ALL
  SELECT 'OP 250_2WS', 295,  9 UNION ALL
  -- OP 260_1
  SELECT 'OP 260_1',  58,  0 UNION ALL
  SELECT 'OP 260_1',  59,  1 UNION ALL
  SELECT 'OP 260_1',  50,  2 UNION ALL
  SELECT 'OP 260_1',  51,  3 UNION ALL
  SELECT 'OP 260_1',  16,  4 UNION ALL
  SELECT 'OP 260_1',  17,  5 UNION ALL
  SELECT 'OP 260_1',  12,  6 UNION ALL
  SELECT 'OP 260_1',  13,  7 UNION ALL
  SELECT 'OP 260_1',  34,  8 UNION ALL
  SELECT 'OP 260_1',  35,  9 UNION ALL
  SELECT 'OP 260_1', 238, 10 UNION ALL
  SELECT 'OP 260_1', 239, 11 UNION ALL
  -- OP 260_2
  SELECT 'OP 260_2',  20,  0 UNION ALL
  SELECT 'OP 260_2',  21,  1 UNION ALL
  SELECT 'OP 260_2',  82,  2 UNION ALL
  SELECT 'OP 260_2',  83,  3 UNION ALL
  SELECT 'OP 260_2', 314,  4 UNION ALL
  SELECT 'OP 260_2', 315,  5 UNION ALL
  SELECT 'OP 260_2',  70,  6 UNION ALL
  SELECT 'OP 260_2',  71,  7 UNION ALL
  SELECT 'OP 260_2', 292,  8 UNION ALL
  SELECT 'OP 260_2', 293,  9 UNION ALL
  SELECT 'OP 260_2', 122, 10 UNION ALL
  SELECT 'OP 260_2', 123, 11 UNION ALL
  SELECT 'OP 260_2', 126, 12 UNION ALL
  SELECT 'OP 260_2', 127, 13 UNION ALL
  SELECT 'OP 260_2', 120, 14 UNION ALL
  SELECT 'OP 260_2', 121, 15 UNION ALL
  SELECT 'OP 260_2', 124, 16 UNION ALL
  SELECT 'OP 260_2', 125, 17 UNION ALL
  -- OP 260_3
  SELECT 'OP 260_3', 280,  0 UNION ALL
  SELECT 'OP 260_3', 281,  1 UNION ALL
  SELECT 'OP 260_3', 176,  2 UNION ALL
  SELECT 'OP 260_3', 173,  3 UNION ALL
  SELECT 'OP 260_3', 174,  4 UNION ALL
  SELECT 'OP 260_3',  40,  5 UNION ALL
  SELECT 'OP 260_3',  41,  6 UNION ALL
  -- OP 260_4
  SELECT 'OP 260_4', 302,  0 UNION ALL
  SELECT 'OP 260_4', 303,  1 UNION ALL
  SELECT 'OP 260_4', 306,  2 UNION ALL
  SELECT 'OP 260_4', 307,  3 UNION ALL
  SELECT 'OP 260_4', 300,  4 UNION ALL
  SELECT 'OP 260_4', 301,  5 UNION ALL
  SELECT 'OP 260_4', 162,  6 UNION ALL
  SELECT 'OP 260_4', 163,  7 UNION ALL
  SELECT 'OP 260_4', 310,  8 UNION ALL
  SELECT 'OP 260_4', 311,  9 UNION ALL
  -- OP 260_5
  SELECT 'OP 260_5',  84,  0 UNION ALL
  SELECT 'OP 260_5',  85,  1 UNION ALL
  SELECT 'OP 260_5',  86,  2 UNION ALL
  SELECT 'OP 260_5',  87,  3 UNION ALL
  SELECT 'OP 260_5', 354,  4 UNION ALL
  SELECT 'OP 260_5', 355,  5 UNION ALL
  SELECT 'OP 260_5', 286,  6 UNION ALL
  SELECT 'OP 260_5', 287,  7 UNION ALL
  SELECT 'OP 260_5', 204,  8 UNION ALL
  SELECT 'OP 260_5', 205,  9 UNION ALL
  -- OP 260_6
  SELECT 'OP 260_6', 338,  0 UNION ALL
  SELECT 'OP 260_6', 339,  1
) c ON c.op_key = op.op_key;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pièces
-- ─────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `pieces` (`operation_id`, `label`, `sort_order`)
SELECT op.id, p.label, p.sort_order
FROM `operations` op
INNER JOIN (
  SELECT 'OP 80'    AS op_key, 'Tôle latérale D'  AS label, 0 AS sort_order UNION ALL
  SELECT 'OP 80',              'Tôle latérale G',           1 UNION ALL
  SELECT 'OP 110',             'Longeron',                  0 UNION ALL
  SELECT 'OP 110',             'Renfort avant',             1 UNION ALL
  SELECT 'OP 150',             'Traverse centrale',         0 UNION ALL
  SELECT 'OP 250_1',           'Platine',                   0 UNION ALL
  SELECT 'OP 250_1',           'Gousset D',                 1 UNION ALL
  SELECT 'OP 250_1',           'Gousset G',                 2
) p ON p.op_key = op.op_key;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sous-ensembles requis
-- ─────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `op_sous_ensembles` (`operation_id`, `ref_label`, `sort_order`)
SELECT op.id, se.ref_label, se.sort_order
FROM `operations` op
INNER JOIN (
  SELECT 'OP 110'   AS op_key, 'OP 80'  AS ref_label, 0 AS sort_order UNION ALL
  SELECT 'OP 210_1',           'OP 110',              0 UNION ALL
  SELECT 'OP 210_1',           'OP 140',              1 UNION ALL
  SELECT 'OP 210_1',           'OP 150',              2 UNION ALL
  SELECT 'OP 250_1',           'OP 210',              0 UNION ALL
  SELECT 'OP 260_1',           'OP 250',              0
) se ON se.op_key = op.op_key;
