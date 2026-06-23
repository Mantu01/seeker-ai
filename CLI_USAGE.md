# Seeker CLI - User Guide & Setup Instructions

Seeker CLI is an outreach email campaign manager. It helps you load lists of target leads from a CSV, select outreach modes, personalize emails (manually or via AI models), preview draft contents, and dispatch emails safely.

---

## 1. Setup & Installation

### Step 1: Install Dependencies
Run from the root directory:
```sh
pnpm install
```

### Step 2: Build Workspace
Build the packages and apps:
```sh
pnpm build
```

### Step 3: Run the CLI
Start the CLI prompt loop:
```sh
cd apps/cli
pnpm start
```

---

## 2. Using Slash Commands

Every command inside Seeker begins with a leading slash `/`. You can navigate your command history at the console prompt using the Up and Down arrow keys:

### `/help`
Displays all available commands and provides support links.

### `/theme`
Allows you to customize the console user interface:
- **Color Themes**: Select colors (Aurora, Midnight, Sunset, Forest, Cyberpunk, or Dracula).
- **Banner Font Styles**: Change the ASCII header banner style (Standard, Slanted, Block, or Isometric).
- **Border Layout Styles**: Toggle window border shapes (Double, Round, Single, or Bold).

### `/show`
Displays a premium visual table showcasing all active config parameters and styling settings:
- UI Theme palette, Banner fonts, and Box borders.
- Active outreach mail mode.
- Template directory path.
- Gmail outreach sender address and credential setup status.
- Primary & fallback AI engine providers with API key verification flags.

### `/config`
Sets up system configurations using a dedicated settings panel:
- **Gmail Account credentials**: Enter Gmail address and app password securely.
- **Generative AI Provider & API Keys**: Select your primary model provider (`openai` or `gemini`) and input respective API keys.

### `/validate`
Checks lead formats:
- Loads the CSV target file from `/assests/data/` (defaults to `leads.csv`).
- Prompts you to select the outreach mode (`generative` or `manual`) for the validation check.
- Runs duplicate email checks and asks once whether to skip them or permanently delete duplicates from the file.
- Verifies that company and email fields exist and check syntax.
- Assures `job_type` exists and matches one of the templates in `/assests/template/` for manual mode, and `description` exists for generative AI mode.

### `/preview`
Generates draft emails for the first three leads in the CSV sheet:
- Prompts you to select the outreach mode (`generative` or `manual`) for the preview run.
- Asks to handle duplicates (skip or delete).
- Prompts for optional custom generative AI parameters (custom prompt, resume, portfolio URL) if in generative mode.

### `/start`
Launches the outreach mailing queue:
- Prompts you to select the outreach mode (`generative` or `manual`) for this run.
- Prompts for the CSV file name (searched under `/assests/data/`).
- Runs a duplicate email check and prompts once to resolve them.
- If in **Generative Mode**, prompts you for optional custom email instructions/style, as well as optional personal resume and portfolio links to feed the AI generator.
- If in **Manual Mode**, prompts the user to select which template enum `job_type` they wish to target, or choose to process all types.
- Asks for campaign confirmation **once** at the beginning.
- Sends emails automatically non-stop, respecting the delivery cooldown wait (no per-email confirmation prompt).
- Automatically handles resumes if you specify `--resume` parameter (`/start --resume`).

### `/status`
Shows a metrics table detailing processed, sent, skipped, and remaining leads.

### `/logs`
Renders a table containing dispatch timestamps, company name, target address, status details, and provider flags.

### `/reset`
Erases current logging tables and returns progress status records back to zero.

### `/exit`
Exits the Seeker CLI shell safely.

---

## 3. CSV Database & Templates Folder Layout

To keep workspace assets clean, Seeker CLI stores data sheets and template files inside a dedicated `assests` directory under the working directory:

```
seeker-cli/
├── assests/
│   ├── data/                  # Place your CSV leads lists here (any filename)
│   │   └── leads.csv
│   └── template/              # Place your manual markdown template files here
│       ├── developer.md       # Name must match your CSV job_type enum value
│       ├── designer.md
│       ├── marketer.md
│       └── manager.md
```

### CSV Lead Sheet Structure
Your CSV files (stored inside `/assests/data/`) must follow this structure:

```csv
company,email,founder_name,description,job_type,website
Google,founder@google.com,Larry Page,Search engine corporation,developer,google.com
Meta,founder@meta.com,Mark Zuckerberg,Social network platform,designer,meta.com
```

### Job Type & Model Mode Field Rules:
1. **Manual Mode**:
   - `job_type` column is **required** for every lead in your CSV database.
   - The value under `job_type` serves as an enum matching one of the template filenames stored in `/assests/template/` (e.g., `developer` matches `/assests/template/developer.md`).
   - Upon running the start command, Seeker reads these template files to present a list of valid enums, allowing you to select a specific job type to target or process all of them.
   - **Template Subject Line Extraction**: The first line of a template (beginning with `# ` or `Subject: `) is automatically extracted and used as the email's Subject Line, while the remaining text is parsed into the HTML email body.
   - The `description` field is **not required** in manual template mode.
2. **Generative AI Mode**:
   - `description` column is **required** to compose AI personalization prompts.
   - `job_type` column is **not required** in generative AI mode.
   - **API Key Presence**: Generative mode requires at least one LLM key (OpenAI or Gemini) to proceed. If none are present, execution is blocked.
   - **Enforced AI Writing**: Hardcoded templates are disabled for generative mode; if AI generation fails, the outreach for that lead fails and an error is logged.
   - **Automatic Fallback**: If only one API key is provided, the engine will automatically select that provider, overriding the primary provider setting if necessary.
