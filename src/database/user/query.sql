DELETE FROM `InitGame`

INSERT INTO `InitGame` (`roundInitMonster`, `normalRoundTime`, `normalRoundNumber`, `bossRoundTime`, `attackCool`, `mpRestoreRate`)
VALUES (8,60000,4,60000,3000,0.4);

DELETE FROM `ShopList`
WHERE round = 5;

INSERT INTO `ShopList` (`round`, `itemList`)
VALUES (3, '[202, 202, 203, 203, 203, 203, 207, 207, 209, 210, 207, 207, 311, 312, 313, 314, 315]');

INSERT INTO `ShopList` (`round`, `itemList`)
VALUES (4, '[205, 205, 205, 205, 206, 206, 208, 208, 209, 209, 210, 210, 316, 317, 318, 319, 320]');

INSERT INTO `ShopList` (`round`, `itemList`)
VALUES (5, '[205, 205, 206, 206, 208, 208, 209, 209, 210, 210, 316, 317, 318, 319, 320]');









