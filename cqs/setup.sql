-- CQS — Checklist Qualité Soudure
-- Schéma normalisé + données initiales complètes
-- Import phpMyAdmin : File → Import → ce fichier

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
-- Données de référence : IPNs, projets, organes
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
-- Procédure : hydrate opérations, cordons, pièces et sous-ensembles
-- Les 16 OPs sont identiques pour tous les organes.
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS `cqs_seed_ops`;

DELIMITER //
CREATE PROCEDURE `cqs_seed_ops`()
BEGIN
  DECLARE done  INT DEFAULT 0;
  DECLARE v_org INT;
  DECLARE v_op  INT;
  DECLARE cur   CURSOR FOR SELECT id FROM organes ORDER BY id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  op_loop: LOOP
    FETCH cur INTO v_org;
    IF done THEN LEAVE op_loop; END IF;

    -- ── OP 80 ────────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 80', 0);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 80');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,260,0),(v_op,261,1),(v_op,262,2),(v_op,263,3);
    INSERT IGNORE INTO pieces (operation_id, label, sort_order) VALUES
      (v_op,'Tôle latérale D',0),(v_op,'Tôle latérale G',1);

    -- ── OP 110 ───────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 110', 1);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 110');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,100,0),(v_op,101,1),(v_op,102,2),(v_op,103,3),
      (v_op,164,4),(v_op,165,5),(v_op,166,6),(v_op,167,7),
      (v_op,168,8),(v_op,169,9),(v_op,22,10),(v_op,23,11);
    INSERT IGNORE INTO pieces (operation_id, label, sort_order) VALUES
      (v_op,'Longeron',0),(v_op,'Renfort avant',1);
    INSERT IGNORE INTO op_sous_ensembles (operation_id, ref_label, sort_order) VALUES
      (v_op,'OP 80',0);

    -- ── OP 140 ───────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 140', 2);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 140');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,308,0),(v_op,309,1),(v_op,304,2),(v_op,305,3),
      (v_op,334,4),(v_op,335,5),(v_op,312,6),(v_op,313,7),
      (v_op,270,8),(v_op,271,9);

    -- ── OP 150 ───────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 150', 3);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 150');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,30,0),(v_op,31,1),(v_op,32,2),(v_op,33,3),
      (v_op,350,4),(v_op,351,5),(v_op,36,6),(v_op,37,7),
      (v_op,38,8),(v_op,39,9),(v_op,365,10),(v_op,352,11),
      (v_op,353,12),(v_op,10,13),(v_op,11,14),(v_op,14,15),(v_op,15,16);
    INSERT IGNORE INTO pieces (operation_id, label, sort_order) VALUES
      (v_op,'Traverse centrale',0);

    -- ── OP 210_1 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 210_1', 4);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 210_1');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,180,0),(v_op,181,1),(v_op,52,2),(v_op,53,3),
      (v_op,132,4),(v_op,133,5),(v_op,140,6),(v_op,141,7),
      (v_op,64,8),(v_op,65,9),(v_op,142,10),(v_op,143,11),
      (v_op,68,12),(v_op,69,13),(v_op,182,14),(v_op,183,15),
      (v_op,200,16),(v_op,201,17),(v_op,208,18),(v_op,209,19),
      (v_op,206,20),(v_op,207,21);
    INSERT IGNORE INTO op_sous_ensembles (operation_id, ref_label, sort_order) VALUES
      (v_op,'OP 110',0),(v_op,'OP 140',1),(v_op,'OP 150',2);

    -- ── OP 210_2 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 210_2', 5);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 210_2');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,336,0),(v_op,337,1),(v_op,190,2),(v_op,191,3),
      (v_op,66,4),(v_op,67,5),(v_op,54,6),(v_op,55,7),
      (v_op,56,8),(v_op,57,9),(v_op,202,10),(v_op,203,11);

    -- ── OP 250_1 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 250_1', 6);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 250_1');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,74,0),(v_op,75,1),(v_op,72,2),(v_op,73,3),
      (v_op,76,4),(v_op,77,5),(v_op,78,6),(v_op,79,7),
      (v_op,80,8),(v_op,81,9),(v_op,90,10),(v_op,91,11),
      (v_op,92,12),(v_op,93,13),(v_op,42,14),(v_op,43,15);
    INSERT IGNORE INTO pieces (operation_id, label, sort_order) VALUES
      (v_op,'Platine',0),(v_op,'Gousset D',1),(v_op,'Gousset G',2);
    INSERT IGNORE INTO op_sous_ensembles (operation_id, ref_label, sort_order) VALUES
      (v_op,'OP 210',0);

    -- ── OP 250_2WS ───────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 250_2WS', 7);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 250_2WS');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,284,0),(v_op,285,1),(v_op,282,2),(v_op,283,3),
      (v_op,288,4),(v_op,289,5),(v_op,290,6),(v_op,291,7),
      (v_op,294,8),(v_op,295,9);

    -- ── OP 250_3 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 250_3', 8);

    -- ── OP 260_1 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_1', 9);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_1');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,58,0),(v_op,59,1),(v_op,50,2),(v_op,51,3),
      (v_op,16,4),(v_op,17,5),(v_op,12,6),(v_op,13,7),
      (v_op,34,8),(v_op,35,9),(v_op,238,10),(v_op,239,11);
    INSERT IGNORE INTO op_sous_ensembles (operation_id, ref_label, sort_order) VALUES
      (v_op,'OP 250',0);

    -- ── OP 260_2 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_2', 10);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_2');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,20,0),(v_op,21,1),(v_op,82,2),(v_op,83,3),
      (v_op,314,4),(v_op,315,5),(v_op,70,6),(v_op,71,7),
      (v_op,292,8),(v_op,293,9),(v_op,122,10),(v_op,123,11),
      (v_op,126,12),(v_op,127,13),(v_op,120,14),(v_op,121,15),
      (v_op,124,16),(v_op,125,17);

    -- ── OP 260_3 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_3', 11);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_3');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,280,0),(v_op,281,1),(v_op,176,2),(v_op,173,3),
      (v_op,174,4),(v_op,40,5),(v_op,41,6);

    -- ── OP 260_4 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_4', 12);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_4');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,302,0),(v_op,303,1),(v_op,306,2),(v_op,307,3),
      (v_op,300,4),(v_op,301,5),(v_op,162,6),(v_op,163,7),
      (v_op,310,8),(v_op,311,9);

    -- ── OP 260_5 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_5', 13);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_5');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,84,0),(v_op,85,1),(v_op,86,2),(v_op,87,3),
      (v_op,354,4),(v_op,355,5),(v_op,286,6),(v_op,287,7),
      (v_op,204,8),(v_op,205,9);

    -- ── OP 260_6 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_6', 14);
    SET v_op = (SELECT id FROM operations WHERE organe_id=v_org AND op_key='OP 260_6');
    INSERT IGNORE INTO cordons (operation_id, numero, sort_order) VALUES
      (v_op,338,0),(v_op,339,1);

    -- ── OP 260_7 ─────────────────────────────────────────────────────────────
    INSERT IGNORE INTO operations (organe_id, op_key, sort_order) VALUES (v_org, 'OP 260_7', 15);

  END LOOP;
  CLOSE cur;
END //
DELIMITER ;

CALL cqs_seed_ops();
DROP PROCEDURE IF EXISTS `cqs_seed_ops`;
