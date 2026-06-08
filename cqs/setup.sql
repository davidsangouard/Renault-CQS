CREATE DATABASE IF NOT EXISTS `cqs_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cqs_db`;

CREATE TABLE IF NOT EXISTS `app_config` (
  `cfg_key`    VARCHAR(50)  NOT NULL,
  `cfg_value`  MEDIUMTEXT   NOT NULL,
  `updated_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cfg_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ordres_fabrication` (
  `of_id`        VARCHAR(100) NOT NULL,
  `projet_id`    VARCHAR(50)  NOT NULL DEFAULT '',
  `projet_label` VARCHAR(100) NOT NULL DEFAULT '',
  `organe_id`    VARCHAR(50)  NOT NULL DEFAULT '',
  `organe_label` VARCHAR(100) NOT NULL DEFAULT '',
  `of_date`      VARCHAR(20)  DEFAULT '',
  `ops_list`     TEXT,
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`of_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `op_verifications` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `of_id`          VARCHAR(100) NOT NULL,
  `op_key`         VARCHAR(50)  NOT NULL,
  `status`         VARCHAR(20)  DEFAULT 'todo',
  `piece_num`      VARCHAR(200) DEFAULT '',
  `ipn`            VARCHAR(50)  DEFAULT '',
  `conformite`     VARCHAR(20)  DEFAULT NULL,
  `commentaire`    TEXT,
  `cordons`        MEDIUMTEXT,
  `retouches`      TEXT,
  `sous_ensembles` MEDIUMTEXT,
  `updated_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_of_op` (`of_id`, `op_key`),
  CONSTRAINT `fk_verif_of` FOREIGN KEY (`of_id`)
    REFERENCES `ordres_fabrication` (`of_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
