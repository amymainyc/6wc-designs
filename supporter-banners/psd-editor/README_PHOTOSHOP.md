# PSD Batch Processor

This Photoshop script automatically processes a CSV file containing names and countries to generate customized PSD files based on a template.

## Files Created

- `psd_processor.jsx` - Main Photoshop script
- `config.js` - Configuration file (JavaScript format)
- `data.csv` - Input data file with names and countries

## Setup Instructions

### 1. Prepare Your Assets

Make sure you have the following folder structure:

```
C:/Users/amyma/Documents/PhotoShop/6WC/
├── supporter_banner_template.psd    (Your template PSD file)
└── assets/
    ├── <name>.png files              (Profile pictures)
    └── flags/
        └── <country>.svg files       (Flag images)
```

### 2. Configure the Script

Edit the paths in `psd_processor.jsx` if needed:

- `TEMPLATE_PSD_PATH`: Path to your template PSD file
- `DATA_FILE`: Path to your CSV file
- `OUTPUT_FOLDER`: Where to save the generated PSD files
- `PROFILES_FOLDER`: Folder containing profile pictures
- `FLAGS_FOLDER`: Folder containing flag images

### 3. Prepare Your PSD Template

Your template PSD should have the following layer structure:

```
PROFILE (Group)
├── Layer containing "PFP!" (for profile picture)
└── Layer containing "NAME!" (for name text)

TITLE (Group)
└── Layer containing "TEAM!" (for country text)

Layer containing "FLAG!" (for flag image)
```

### 4. Run the Script

#### Option A: Run from Photoshop
1. Open Adobe Photoshop
2. Go to File > Scripts > Browse...
3. Select `psd_processor.jsx`
4. Click "Load"

#### Option B: Run from ExtendScript Toolkit
1. Open Adobe ExtendScript Toolkit
2. Open `psd_processor.jsx`
3. Select "Adobe Photoshop" as target
4. Click Run

## How It Works

The script will:

1. Read the `data.csv` file
2. For each row (name, country):
   - Open the template PSD
   - Replace the profile picture with `<name>.png`
   - Update the name text layer with the person's name
   - Update the country text with "TEAM <COUNTRY>" 
   - Replace the flag image with `<country>.svg`
   - Save as `<name>_<country>.psd` in the output folder

## Input Data Format

The CSV file should have this format:

```csv
name,country
300ping,Canada
Alymetic,Taiwan
joyin1211,Russia
Eric44168,Taiwan
```

## Asset Naming Requirements

- Profile pictures: `<name>.png` (exact match to CSV name)
- Flag images: `<country>.svg` (lowercase country name)

## Troubleshooting

- Make sure all file paths exist
- Check that layer names in your PSD match the keywords in the config
- Verify that all required assets (profile pictures and flags) exist
- For SVG flags, consider converting to PNG if Photoshop has issues

## Customization

You can modify the following in the script:

- Layer name keywords (PROFILE_IMAGE_KEYWORD, etc.)
- Country text template (currently "TEAM {country}")
- Text case conversion (COUNTRY_TEXT_UPPERCASE)
- Output filename format

## Generated Files

The script creates PSD files named: `<name>_<country>.psd`

Example: `300ping_Canada.psd`, `Alymetic_Taiwan.psd`
