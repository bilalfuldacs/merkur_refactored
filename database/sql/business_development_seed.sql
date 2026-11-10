CREATE TABLE IF NOT EXISTS `bd_regions` (
	`ID` TINYINT UNSIGNED NOT NULL,
	`code` VARCHAR(12) NOT NULL,
	`name` VARCHAR(80) NOT NULL,
	`sort_order` TINYINT UNSIGNED NOT NULL,
	PRIMARY KEY (`ID`),
	UNIQUE KEY `uq_bd_regions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bd_segments` (
	`ID` TINYINT UNSIGNED NOT NULL,
	`name` VARCHAR(80) NOT NULL,
	`sort_order` TINYINT UNSIGNED NOT NULL,
	PRIMARY KEY (`ID`),
	UNIQUE KEY `uq_bd_segments_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bd_markets` (
	`ID` SMALLINT UNSIGNED NOT NULL,
	`name` VARCHAR(120) NOT NULL,
	`region_ID` TINYINT UNSIGNED NOT NULL COMMENT '@bd_regions.name',
	`status` ENUM('merkur','open','watch','nogo') NOT NULL,
	PRIMARY KEY (`ID`),
	UNIQUE KEY `uq_bd_markets_name` (`name`),
	KEY `idx_bd_markets_region` (`region_ID`),
	KEY `idx_bd_markets_status` (`status`),
	CONSTRAINT `fk_bd_markets_region` FOREIGN KEY (`region_ID`) REFERENCES `bd_regions` (`ID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- Opening the Business Development page also adds mod_date / mod_by and history triggers.

CREATE TABLE IF NOT EXISTS `bd_market_jurisdictions` (
	`market_ID` SMALLINT UNSIGNED NOT NULL,
	`jurisdiction_ID` INT UNSIGNED NOT NULL COMMENT '@jurisdictions.name_english',
	PRIMARY KEY (`jurisdiction_ID`),
	KEY `idx_bd_mj_market` (`market_ID`),
	CONSTRAINT `fk_bd_mj_market` FOREIGN KEY (`market_ID`) REFERENCES `bd_markets` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `fk_bd_mj_jurisdiction` FOREIGN KEY (`jurisdiction_ID`) REFERENCES `jurisdictions` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- Primary key on jurisdiction_ID: one jurisdiction belongs to one market.
-- market_ID is not unique: one market can link casino, arcade, and pub jurisdictions.

CREATE TABLE IF NOT EXISTS `bd_market_segments` (
	`market_ID` SMALLINT UNSIGNED NOT NULL,
	`segment_ID` TINYINT UNSIGNED NOT NULL,
	`presence` ENUM('present','limited','planned','absent') NOT NULL,
	PRIMARY KEY (`market_ID`, `segment_ID`),
	KEY `idx_bd_ms_segment` (`segment_ID`),
	CONSTRAINT `fk_bd_ms_market` FOREIGN KEY (`market_ID`) REFERENCES `bd_markets` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `fk_bd_ms_segment` FOREIGN KEY (`segment_ID`) REFERENCES `bd_segments` (`ID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `bd_regions` (`ID`, `code`, `name`, `sort_order`) VALUES
(1, 'EMEA', 'EMEA', 1),
(2, 'NA', 'North America', 2),
(3, 'LAC', 'Latin America and the Caribbean', 3),
(4, 'ASIA', 'Asia (excluding Japan)', 4),
(5, 'ANZ', 'Australia and New Zealand', 5),
(6, 'JAPAN', 'Japan', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `sort_order` = VALUES(`sort_order`);

INSERT INTO `bd_segments` (`ID`, `name`, `sort_order`) VALUES
(1, 'Casinos', 1),
(2, 'Street / Arcades / Halls', 2),
(3, 'HoReCa / Bar', 3),
(4, 'VLT', 4),
(5, 'Pachinko', 5),
(6, 'Video Bingo', 6),
(7, 'HHR', 7),
(8, 'Class II', 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `sort_order` = VALUES(`sort_order`);

INSERT INTO `bd_markets` (`ID`, `name`, `region_ID`, `status`)
SELECT ID, name, region_ID, status FROM (
SELECT 1 AS ID, 'Argentina' AS name, 3 AS region_ID, 'merkur' AS status UNION ALL
SELECT 2 AS ID, 'Armenia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 3 AS ID, 'Austria' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 4 AS ID, 'Bosnia and Herzegovina' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 5 AS ID, 'Bulgaria' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 6 AS ID, 'Canada' AS name, 2 AS region_ID, 'merkur' AS status UNION ALL
SELECT 7 AS ID, 'Colombia' AS name, 3 AS region_ID, 'merkur' AS status UNION ALL
SELECT 8 AS ID, 'Croatia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 9 AS ID, 'Cyprus' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 10 AS ID, 'Czech Republic' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 11 AS ID, 'Denmark' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 12 AS ID, 'Dominican Republic' AS name, 3 AS region_ID, 'merkur' AS status UNION ALL
SELECT 13 AS ID, 'Estonia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 14 AS ID, 'France' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 15 AS ID, 'Georgia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 16 AS ID, 'Germany' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 17 AS ID, 'Greece' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 18 AS ID, 'Hungary' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 19 AS ID, 'Ireland' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 20 AS ID, 'Italy' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 21 AS ID, 'Kazakhstan' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 22 AS ID, 'Latvia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 23 AS ID, 'Liechtenstein' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 24 AS ID, 'Lithuania' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 25 AS ID, 'Luxembourg' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 26 AS ID, 'Malta' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 27 AS ID, 'Mexico' AS name, 3 AS region_ID, 'merkur' AS status UNION ALL
SELECT 28 AS ID, 'Montenegro' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 29 AS ID, 'Morocco' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 30 AS ID, 'Netherlands' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 31 AS ID, 'North Macedonia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 32 AS ID, 'Peru' AS name, 3 AS region_ID, 'merkur' AS status UNION ALL
SELECT 33 AS ID, 'Poland' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 34 AS ID, 'Portugal' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 35 AS ID, 'Serbia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 36 AS ID, 'Slovakia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 37 AS ID, 'Slovenia' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 38 AS ID, 'South Africa' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 39 AS ID, 'Spain' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 40 AS ID, 'Sweden' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 41 AS ID, 'Switzerland' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 42 AS ID, 'United Kingdom' AS name, 1 AS region_ID, 'merkur' AS status UNION ALL
SELECT 43 AS ID, 'United States' AS name, 2 AS region_ID, 'merkur' AS status UNION ALL
SELECT 44 AS ID, 'Albania' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 45 AS ID, 'Andorra' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 46 AS ID, 'Angola' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 47 AS ID, 'Antigua and Barbuda' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 48 AS ID, 'Australia' AS name, 5 AS region_ID, 'open' AS status UNION ALL
SELECT 49 AS ID, 'Bahamas' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 50 AS ID, 'Barbados' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 51 AS ID, 'Belarus' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 52 AS ID, 'Belgium' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 53 AS ID, 'Belize' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 54 AS ID, 'Benin' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 55 AS ID, 'Bolivia' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 56 AS ID, 'Botswana' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 57 AS ID, 'Burkina Faso' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 58 AS ID, 'Burundi' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 59 AS ID, 'Cabo Verde' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 60 AS ID, 'Cambodia' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 61 AS ID, 'Cameroon' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 62 AS ID, 'Central African Republic' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 63 AS ID, 'Chad' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 64 AS ID, 'Chile' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 65 AS ID, 'Macau' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 66 AS ID, 'Comoros' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 67 AS ID, 'Congo (Republic of the)' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 68 AS ID, 'Costa Rica' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 69 AS ID, 'Democratic Republic of the Congo' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 70 AS ID, 'Djibouti' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 71 AS ID, 'Dominica' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 72 AS ID, 'Egypt' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 73 AS ID, 'El Salvador' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 74 AS ID, 'Equatorial Guinea' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 75 AS ID, 'Eswatini' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 76 AS ID, 'Ethiopia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 77 AS ID, 'Fiji' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 78 AS ID, 'Finland' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 79 AS ID, 'Gabon' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 80 AS ID, 'Gambia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 81 AS ID, 'Ghana' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 82 AS ID, 'Grenada' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 83 AS ID, 'Guatemala' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 84 AS ID, 'Guinea' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 85 AS ID, 'Guinea-Bissau' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 86 AS ID, 'Guyana' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 87 AS ID, 'Haiti' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 88 AS ID, 'Honduras' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 89 AS ID, 'Iceland' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 90 AS ID, 'India' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 91 AS ID, 'Jamaica' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 92 AS ID, 'Japan' AS name, 6 AS region_ID, 'open' AS status UNION ALL
SELECT 93 AS ID, 'Kenya' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 94 AS ID, 'Kiribati' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 95 AS ID, 'Kyrgyzstan' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 96 AS ID, 'Laos' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 97 AS ID, 'Lebanon' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 98 AS ID, 'Lesotho' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 99 AS ID, 'Liberia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 100 AS ID, 'Madagascar' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 101 AS ID, 'Malawi' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 102 AS ID, 'Malaysia' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 103 AS ID, 'Mali' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 104 AS ID, 'Marshall Islands' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 105 AS ID, 'Mauritius' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 106 AS ID, 'Micronesia' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 107 AS ID, 'Moldova' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 108 AS ID, 'Monaco' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 109 AS ID, 'Mozambique' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 110 AS ID, 'Namibia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 111 AS ID, 'Nauru' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 112 AS ID, 'Nepal' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 113 AS ID, 'New Zealand' AS name, 5 AS region_ID, 'open' AS status UNION ALL
SELECT 114 AS ID, 'Nicaragua' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 115 AS ID, 'Niger' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 116 AS ID, 'Nigeria' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 117 AS ID, 'Norway' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 118 AS ID, 'Panama' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 119 AS ID, 'Papua New Guinea' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 120 AS ID, 'Paraguay' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 121 AS ID, 'Philippines' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 122 AS ID, 'Romania' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 123 AS ID, 'Rwanda' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 124 AS ID, 'Saint Kitts and Nevis' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 125 AS ID, 'Saint Lucia' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 126 AS ID, 'Saint Vincent and the Grenadines' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 127 AS ID, 'Samoa' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 128 AS ID, 'San Marino' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 129 AS ID, 'Sao Tome and Principe' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 130 AS ID, 'Senegal' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 131 AS ID, 'Seychelles' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 132 AS ID, 'Sierra Leone' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 133 AS ID, 'Singapore' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 134 AS ID, 'Solomon Islands' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 135 AS ID, 'South Korea' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 136 AS ID, 'Sri Lanka' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 137 AS ID, 'Suriname' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 138 AS ID, 'Tajikistan' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 139 AS ID, 'Tanzania' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 140 AS ID, 'Timor-Leste' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 141 AS ID, 'Togo' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 142 AS ID, 'Tonga' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 143 AS ID, 'Trinidad and Tobago' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 144 AS ID, 'Tunisia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 145 AS ID, 'Turkmenistan' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 146 AS ID, 'Uganda' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 147 AS ID, 'United Arab Emirates' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 148 AS ID, 'Gibraltar' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 149 AS ID, 'Bermuda' AS name, 2 AS region_ID, 'open' AS status UNION ALL
SELECT 150 AS ID, 'Turks and Caicos Islands' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 151 AS ID, 'British Virgin Islands' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 152 AS ID, 'Uruguay' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 153 AS ID, 'Vanuatu' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 154 AS ID, 'Venezuela' AS name, 3 AS region_ID, 'open' AS status UNION ALL
SELECT 155 AS ID, 'Vietnam' AS name, 4 AS region_ID, 'open' AS status UNION ALL
SELECT 156 AS ID, 'Zambia' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 157 AS ID, 'Zimbabwe' AS name, 1 AS region_ID, 'open' AS status UNION ALL
SELECT 158 AS ID, 'Afghanistan' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 159 AS ID, 'Algeria' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 160 AS ID, 'Bangladesh' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 161 AS ID, 'Bhutan' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 162 AS ID, 'Brunei' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 163 AS ID, 'Hong Kong' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 164 AS ID, 'Eritrea' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 165 AS ID, 'Iran' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 166 AS ID, 'Iraq' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 167 AS ID, 'Jordan' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 168 AS ID, 'Kuwait' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 169 AS ID, 'Libya' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 170 AS ID, 'Mauritania' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 171 AS ID, 'North Korea' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 172 AS ID, 'Palau' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 173 AS ID, 'Qatar' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 174 AS ID, 'Somalia' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 175 AS ID, 'South Sudan' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 176 AS ID, 'Sudan' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 177 AS ID, 'Syria' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 178 AS ID, 'Turkey' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 179 AS ID, 'Tuvalu' AS name, 4 AS region_ID, 'nogo' AS status UNION ALL
SELECT 180 AS ID, 'Anguilla' AS name, 3 AS region_ID, 'nogo' AS status UNION ALL
SELECT 181 AS ID, 'Cayman Islands' AS name, 3 AS region_ID, 'nogo' AS status UNION ALL
SELECT 182 AS ID, 'Montserrat' AS name, 3 AS region_ID, 'nogo' AS status UNION ALL
SELECT 183 AS ID, 'Falkland Islands' AS name, 3 AS region_ID, 'nogo' AS status UNION ALL
SELECT 184 AS ID, 'Saint Helena Group' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 185 AS ID, 'Pitcairn Islands' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 186 AS ID, 'South Georgia' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 187 AS ID, 'Akrotiri/Dhekelia' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 188 AS ID, 'The British Antarctic Territory' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 189 AS ID, 'The British Indian Ocean Territory' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 190 AS ID, 'Yemen' AS name, 1 AS region_ID, 'nogo' AS status UNION ALL
SELECT 191 AS ID, 'Azerbaijan' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 192 AS ID, 'Bahrain' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 193 AS ID, 'Brazil' AS name, 3 AS region_ID, 'watch' AS status UNION ALL
SELECT 194 AS ID, 'China' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 195 AS ID, 'Cuba' AS name, 3 AS region_ID, 'watch' AS status UNION ALL
SELECT 196 AS ID, 'Ecuador' AS name, 3 AS region_ID, 'watch' AS status UNION ALL
SELECT 197 AS ID, 'Indonesia' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 198 AS ID, 'Israel' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 199 AS ID, 'Maldives' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 200 AS ID, 'Mongolia' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 201 AS ID, 'Myanmar' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 202 AS ID, 'Oman' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 203 AS ID, 'Pakistan' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 204 AS ID, 'Russia' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 205 AS ID, 'Saudi Arabia' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 206 AS ID, 'Thailand' AS name, 4 AS region_ID, 'watch' AS status UNION ALL
SELECT 207 AS ID, 'Ukraine' AS name, 1 AS region_ID, 'watch' AS status UNION ALL
SELECT 208 AS ID, 'Uzbekistan' AS name, 1 AS region_ID, 'watch' AS status
) seed
WHERE NOT EXISTS (SELECT 1 FROM `bd_markets` LIMIT 1);

INSERT INTO `bd_market_segments` (`market_ID`, `segment_ID`, `presence`)
SELECT market_ID, segment_ID, presence FROM (
SELECT 1 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 1 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 1 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 1 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 1 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 1 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 1 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 1 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 2 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 2 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 2 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 2 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 2 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 2 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 2 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 2 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 3 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 3 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 3 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 3 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 3 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 3 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 3 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 3 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 4 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 4 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 4 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 4 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 4 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 4 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 4 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 4 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 5 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 5 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 5 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 5 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 5 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 5 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 5 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 5 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 6 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 6 AS market_ID, 2 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 6 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 6 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 6 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 6 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 6 AS market_ID, 7 AS segment_ID, 'present' AS presence UNION ALL
SELECT 6 AS market_ID, 8 AS segment_ID, 'present' AS presence UNION ALL
SELECT 7 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 7 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 7 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 7 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 7 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 7 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 7 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 7 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 8 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 8 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 8 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 8 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 8 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 8 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 8 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 8 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 9 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 9 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 9 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 9 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 9 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 9 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 9 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 9 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 10 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 10 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 10 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 10 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 10 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 10 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 10 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 10 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 11 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 11 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 11 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 11 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 11 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 11 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 11 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 11 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 12 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 12 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 12 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 12 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 12 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 12 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 12 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 12 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 13 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 13 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 13 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 13 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 13 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 13 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 13 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 13 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 14 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 14 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 14 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 14 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 14 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 14 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 14 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 14 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 15 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 15 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 15 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 15 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 15 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 15 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 15 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 15 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 16 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 16 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 16 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 16 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 16 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 16 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 16 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 16 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 17 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 17 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 17 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 17 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 17 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 17 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 17 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 17 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 18 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 18 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 18 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 18 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 18 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 18 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 18 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 18 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 19 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 19 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 19 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 19 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 19 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 19 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 19 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 19 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 20 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 20 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 20 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 20 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 20 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 20 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 20 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 20 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 21 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 21 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 21 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 21 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 21 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 21 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 21 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 21 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 22 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 22 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 22 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 22 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 22 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 22 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 22 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 22 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 23 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 23 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 23 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 23 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 23 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 23 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 23 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 23 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 24 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 24 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 24 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 24 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 24 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 24 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 24 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 24 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 25 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 25 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 25 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 25 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 25 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 25 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 25 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 25 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 26 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 26 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 26 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 26 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 26 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 26 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 26 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 26 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 27 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 27 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 27 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 27 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 27 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 27 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 27 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 27 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 28 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 28 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 28 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 28 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 28 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 28 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 28 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 28 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 29 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 29 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 29 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 29 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 29 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 29 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 29 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 29 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 30 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 30 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 30 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 30 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 30 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 30 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 30 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 30 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 31 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 31 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 31 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 31 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 31 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 31 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 31 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 31 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 32 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 32 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 32 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 32 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 32 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 32 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 32 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 32 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 33 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 33 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 33 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 33 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 33 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 33 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 33 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 33 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 34 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 34 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 34 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 34 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 34 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 34 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 34 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 34 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 35 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 35 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 35 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 35 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 35 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 35 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 35 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 35 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 36 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 36 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 36 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 36 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 36 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 36 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 36 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 36 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 37 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 37 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 37 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 37 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 37 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 37 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 37 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 37 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 38 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 38 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 38 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 38 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 38 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 38 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 38 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 38 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 39 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 39 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 39 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 39 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 39 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 39 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 39 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 39 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 40 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 40 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 40 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 40 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 40 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 40 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 40 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 40 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 41 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 41 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 41 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 41 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 41 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 41 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 41 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 41 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 42 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 42 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 42 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 42 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 42 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 42 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 42 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 42 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 43 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 43 AS market_ID, 2 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 43 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 43 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 43 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 43 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 43 AS market_ID, 7 AS segment_ID, 'present' AS presence UNION ALL
SELECT 43 AS market_ID, 8 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 44 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 44 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 44 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 45 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 45 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 45 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 45 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 45 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 45 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 45 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 45 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 46 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 46 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 46 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 46 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 46 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 46 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 46 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 46 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 47 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 47 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 47 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 47 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 47 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 47 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 47 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 47 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 48 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 48 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 48 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 48 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 48 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 48 AS market_ID, 6 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 48 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 48 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 49 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 49 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 49 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 49 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 49 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 49 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 49 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 49 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 50 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 50 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 50 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 50 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 50 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 50 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 50 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 50 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 51 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 51 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 51 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 51 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 51 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 51 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 51 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 51 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 52 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 52 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 52 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 52 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 52 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 52 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 52 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 52 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 53 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 53 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 53 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 53 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 53 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 53 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 53 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 53 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 54 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 54 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 54 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 54 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 54 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 54 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 54 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 54 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 55 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 55 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 55 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 55 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 55 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 55 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 55 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 55 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 56 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 56 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 56 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 56 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 56 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 56 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 56 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 56 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 57 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 57 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 57 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 57 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 57 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 57 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 57 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 57 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 58 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 58 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 58 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 58 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 58 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 58 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 58 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 58 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 59 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 59 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 59 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 59 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 59 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 59 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 59 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 59 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 60 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 60 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 60 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 60 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 60 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 60 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 60 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 60 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 61 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 61 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 61 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 61 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 61 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 61 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 61 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 61 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 62 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 62 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 62 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 62 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 62 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 62 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 62 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 62 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 63 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 63 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 63 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 63 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 63 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 63 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 63 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 63 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 64 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 64 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 64 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 64 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 64 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 64 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 64 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 64 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 65 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 65 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 65 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 65 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 65 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 65 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 65 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 65 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 66 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 66 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 66 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 66 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 66 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 66 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 66 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 66 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 67 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 67 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 67 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 67 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 67 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 67 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 67 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 67 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 68 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 68 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 68 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 68 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 68 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 68 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 68 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 68 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 69 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 69 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 69 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 69 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 69 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 69 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 69 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 69 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 70 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 70 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 70 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 70 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 70 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 70 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 70 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 70 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 71 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 71 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 71 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 71 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 71 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 71 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 71 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 71 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 72 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 72 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 72 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 72 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 72 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 72 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 72 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 72 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 73 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 73 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 73 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 73 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 73 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 73 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 73 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 73 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 74 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 74 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 74 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 74 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 74 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 74 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 74 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 74 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 75 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 75 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 75 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 75 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 75 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 75 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 75 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 75 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 76 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 76 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 76 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 76 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 76 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 76 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 76 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 76 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 77 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 77 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 77 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 77 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 77 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 77 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 77 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 77 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 78 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 78 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 78 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 78 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 78 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 78 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 78 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 78 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 79 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 79 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 79 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 79 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 79 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 79 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 79 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 79 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 80 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 80 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 80 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 80 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 80 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 80 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 80 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 80 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 81 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 81 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 81 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 81 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 81 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 81 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 81 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 81 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 82 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 82 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 82 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 82 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 82 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 82 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 82 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 82 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 83 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 83 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 83 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 83 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 83 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 83 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 83 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 83 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 84 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 84 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 84 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 84 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 84 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 84 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 84 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 84 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 85 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 85 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 85 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 85 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 85 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 85 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 85 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 85 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 86 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 86 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 86 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 86 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 86 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 86 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 86 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 86 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 87 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 87 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 87 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 87 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 87 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 87 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 87 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 87 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 88 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 88 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 88 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 88 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 88 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 88 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 88 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 88 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 89 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 89 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 89 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 89 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 89 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 89 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 89 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 89 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 90 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 90 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 90 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 90 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 90 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 90 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 90 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 90 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 91 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 91 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 91 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 91 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 91 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 91 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 91 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 91 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 1 AS segment_ID, 'planned' AS presence UNION ALL
SELECT 92 AS market_ID, 2 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 3 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 4 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 5 AS segment_ID, 'present' AS presence UNION ALL
SELECT 92 AS market_ID, 6 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 92 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 93 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 93 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 93 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 93 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 93 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 93 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 93 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 93 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 94 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 94 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 94 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 94 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 94 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 94 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 94 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 94 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 95 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 95 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 95 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 95 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 95 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 95 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 95 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 95 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 96 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 96 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 96 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 96 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 96 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 96 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 96 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 96 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 97 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 97 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 97 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 97 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 97 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 97 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 97 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 97 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 98 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 98 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 98 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 98 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 98 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 98 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 98 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 98 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 99 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 99 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 99 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 99 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 99 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 99 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 99 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 99 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 100 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 100 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 100 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 100 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 100 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 100 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 100 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 100 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 101 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 101 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 101 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 101 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 101 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 101 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 101 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 101 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 102 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 102 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 102 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 102 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 102 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 102 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 102 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 102 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 103 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 103 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 103 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 103 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 103 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 103 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 103 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 103 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 104 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 104 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 104 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 104 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 104 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 104 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 104 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 104 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 105 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 105 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 105 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 105 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 105 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 105 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 105 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 105 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 106 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 106 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 106 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 106 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 106 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 106 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 106 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 106 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 107 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 107 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 107 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 107 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 107 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 107 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 107 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 107 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 108 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 108 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 108 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 108 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 108 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 108 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 108 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 108 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 109 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 109 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 109 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 109 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 109 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 109 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 109 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 109 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 110 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 110 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 110 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 110 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 110 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 110 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 110 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 110 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 111 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 111 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 111 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 111 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 111 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 111 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 111 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 111 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 112 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 112 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 112 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 112 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 112 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 112 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 112 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 112 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 113 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 113 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 113 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 113 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 113 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 113 AS market_ID, 6 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 113 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 113 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 114 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 114 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 114 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 114 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 114 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 114 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 114 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 114 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 115 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 115 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 115 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 115 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 115 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 115 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 115 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 115 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 116 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 116 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 116 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 116 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 116 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 116 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 116 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 116 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 117 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 117 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 117 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 117 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 117 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 117 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 117 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 117 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 118 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 118 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 118 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 118 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 118 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 118 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 118 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 118 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 119 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 119 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 119 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 119 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 119 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 119 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 119 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 119 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 120 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 120 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 120 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 120 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 120 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 120 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 120 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 120 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 121 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 121 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 121 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 121 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 121 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 121 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 121 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 121 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 122 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 122 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 122 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 122 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 122 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 122 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 122 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 122 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 123 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 123 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 123 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 123 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 123 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 123 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 123 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 123 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 124 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 124 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 124 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 124 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 124 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 124 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 124 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 124 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 125 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 125 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 125 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 125 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 125 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 125 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 125 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 125 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 126 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 126 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 126 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 126 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 126 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 126 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 126 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 126 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 127 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 127 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 127 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 127 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 127 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 127 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 127 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 127 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 128 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 128 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 128 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 128 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 128 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 128 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 128 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 128 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 129 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 129 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 129 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 129 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 129 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 129 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 129 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 129 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 130 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 130 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 130 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 130 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 130 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 130 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 130 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 130 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 131 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 131 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 131 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 131 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 131 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 131 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 131 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 131 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 132 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 132 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 132 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 132 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 132 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 132 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 132 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 132 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 133 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 133 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 133 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 133 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 133 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 133 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 133 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 133 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 134 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 134 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 134 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 134 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 134 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 134 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 134 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 134 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 135 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 135 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 135 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 135 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 135 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 135 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 135 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 135 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 136 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 136 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 136 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 136 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 136 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 136 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 136 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 136 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 137 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 137 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 137 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 137 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 137 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 137 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 137 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 137 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 138 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 138 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 138 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 138 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 138 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 138 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 138 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 138 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 139 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 139 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 139 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 139 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 139 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 139 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 139 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 139 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 140 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 140 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 140 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 140 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 140 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 140 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 140 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 140 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 141 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 141 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 141 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 141 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 141 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 141 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 141 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 141 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 142 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 142 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 142 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 142 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 142 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 142 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 142 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 142 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 143 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 143 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 143 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 143 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 143 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 143 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 143 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 143 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 144 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 144 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 144 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 144 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 144 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 144 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 144 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 144 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 145 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 145 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 145 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 145 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 145 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 145 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 145 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 145 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 146 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 146 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 146 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 146 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 146 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 146 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 146 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 146 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 147 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 147 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 147 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 147 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 147 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 147 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 147 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 147 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 148 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 148 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 148 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 148 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 148 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 148 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 148 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 148 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 149 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 149 AS market_ID, 2 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 149 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 149 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 149 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 149 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 149 AS market_ID, 7 AS segment_ID, 'present' AS presence UNION ALL
SELECT 149 AS market_ID, 8 AS segment_ID, 'present' AS presence UNION ALL
SELECT 150 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 150 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 150 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 150 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 150 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 150 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 150 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 150 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 151 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 151 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 151 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 151 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 151 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 151 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 151 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 151 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 152 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 152 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 152 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 152 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 152 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 152 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 152 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 152 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 153 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 153 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 153 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 153 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 153 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 153 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 153 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 153 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 154 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 154 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 154 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 154 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 154 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 154 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 154 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 154 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 155 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 155 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 155 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 155 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 155 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 155 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 155 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 155 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 156 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 156 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 156 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 156 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 156 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 156 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 156 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 156 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 157 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 157 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 157 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 157 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 157 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 157 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 157 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 157 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 191 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 191 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 191 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 191 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 191 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 191 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 191 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 191 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 192 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 192 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 192 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 192 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 192 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 192 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 192 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 192 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 193 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 193 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 193 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 193 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 193 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 193 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 193 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 193 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 194 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 194 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 194 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 194 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 194 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 194 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 194 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 194 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 195 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 195 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 195 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 195 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 195 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 195 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 195 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 195 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 196 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 196 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 196 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 196 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 196 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 196 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 196 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 196 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 197 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 197 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 197 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 197 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 197 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 197 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 197 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 197 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 198 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 198 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 198 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 198 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 198 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 198 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 198 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 198 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 199 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 199 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 199 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 199 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 199 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 199 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 199 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 199 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 200 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 200 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 200 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 200 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 200 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 200 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 200 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 200 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 201 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 201 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 201 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 201 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 201 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 201 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 201 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 201 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 202 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 202 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 202 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 202 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 202 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 202 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 202 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 202 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 203 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 203 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 203 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 203 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 203 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 203 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 203 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 203 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 204 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 204 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 204 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 204 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 204 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 204 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 204 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 204 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 205 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 205 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 205 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 205 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 205 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 205 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 205 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 205 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 206 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 206 AS market_ID, 2 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 206 AS market_ID, 3 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 206 AS market_ID, 4 AS segment_ID, 'limited' AS presence UNION ALL
SELECT 206 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 206 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 206 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 206 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 207 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 207 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 207 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 207 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 207 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 207 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 207 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 207 AS market_ID, 8 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 208 AS market_ID, 1 AS segment_ID, 'present' AS presence UNION ALL
SELECT 208 AS market_ID, 2 AS segment_ID, 'present' AS presence UNION ALL
SELECT 208 AS market_ID, 3 AS segment_ID, 'present' AS presence UNION ALL
SELECT 208 AS market_ID, 4 AS segment_ID, 'present' AS presence UNION ALL
SELECT 208 AS market_ID, 5 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 208 AS market_ID, 6 AS segment_ID, 'present' AS presence UNION ALL
SELECT 208 AS market_ID, 7 AS segment_ID, 'absent' AS presence UNION ALL
SELECT 208 AS market_ID, 8 AS segment_ID, 'absent' AS presence
) seed
WHERE NOT EXISTS (SELECT 1 FROM `bd_market_segments` LIMIT 1);


