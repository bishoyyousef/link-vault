# Seed demo account with dummy data
$base = "http://linkvaultapi.runasp.net/api"
$headers = @{ "Content-Type" = "application/json" }

# 1. Login to get token
Write-Host ">> Logging in as demo user..." -ForegroundColor Cyan
$loginBody = '{"email":"demo.visitor@linkvault.app","password":"Demo@12345"}'
$loginResp = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

if ($loginResp.token) {
    $token = $loginResp.token
} elseif ($loginResp -is [string]) {
    $token = $loginResp
} else {
    Write-Host "ERROR: Could not get token" -ForegroundColor Red
    exit 1
}

$headers["Authorization"] = "Bearer $token"
Write-Host ">> Login successful!" -ForegroundColor Green

# Helper function
function ApiPost($endpoint, $body) {
    $json = $body | ConvertTo-Json -Depth 10
    try {
        $resp = Invoke-RestMethod -Uri "$base$endpoint" -Method POST -Body $json -Headers $headers -ContentType "application/json"
        return $resp
    } catch {
        Write-Host "  WARN: $endpoint - $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
}

# 2. Create Categories
Write-Host "`n>> Creating categories..." -ForegroundColor Cyan
$categories = @(
    @{ categoryName = "Frontend Development"; description = "HTML, CSS, JavaScript frameworks and UI libraries" },
    @{ categoryName = "Backend & APIs"; description = "Server-side frameworks, REST APIs, databases and DevOps" },
    @{ categoryName = "Design Inspiration"; description = "UI/UX design resources, color palettes and typography" },
    @{ categoryName = "Learning Resources"; description = "Online courses, tutorials and documentation" },
    @{ categoryName = "Productivity Tools"; description = "Apps and tools to boost daily workflow and efficiency" }
)

$catIds = @()
foreach ($cat in $categories) {
    $resp = ApiPost "/categories" $cat
    if ($resp -and $resp.id) {
        $catIds += $resp.id
        Write-Host "  Created: $($cat.categoryName) (ID: $($resp.id))" -ForegroundColor Green
    } else {
        Write-Host "  Created: $($cat.categoryName)" -ForegroundColor Green
        $catIds += 0
    }
}

# If we couldn't get IDs from create response, fetch them
if ($catIds[0] -eq 0) {
    Write-Host "`n>> Fetching category IDs..." -ForegroundColor Cyan
    $allCats = Invoke-RestMethod -Uri "$base/categories" -Method GET -Headers $headers -ContentType "application/json"
    $catIds = @()
    foreach ($c in $allCats) {
        $catIds += $c.id
    }
    Write-Host "  Found $($catIds.Count) categories" -ForegroundColor Green
}

# 3. Create Bookmarks
Write-Host "`n>> Creating bookmarks..." -ForegroundColor Cyan
$bookmarks = @(
    # Frontend Development
    @{ url = "https://react.dev"; title = "React Official Documentation"; categoryId = $catIds[0] },
    @{ url = "https://angular.dev"; title = "Angular Developer Guide"; categoryId = $catIds[0] },
    @{ url = "https://vuejs.org"; title = "Vue.js Framework"; categoryId = $catIds[0] },
    @{ url = "https://tailwindcss.com"; title = "Tailwind CSS Utility Framework"; categoryId = $catIds[0] },
    @{ url = "https://nextjs.org"; title = "Next.js - The React Framework"; categoryId = $catIds[0] },

    # Backend & APIs
    @{ url = "https://dotnet.microsoft.com/en-us/apps/aspnet"; title = "ASP.NET Core Web APIs"; categoryId = $catIds[1] },
    @{ url = "https://nodejs.org"; title = "Node.js Runtime"; categoryId = $catIds[1] },
    @{ url = "https://www.postgresql.org"; title = "PostgreSQL Database"; categoryId = $catIds[1] },
    @{ url = "https://swagger.io"; title = "Swagger API Documentation"; categoryId = $catIds[1] },
    @{ url = "https://firebase.google.com"; title = "Google Firebase Platform"; categoryId = $catIds[1] },

    # Design Inspiration
    @{ url = "https://dribbble.com"; title = "Dribbble - Design Portfolio Showcase"; categoryId = $catIds[2] },
    @{ url = "https://www.figma.com"; title = "Figma - Collaborative Design Tool"; categoryId = $catIds[2] },
    @{ url = "https://coolors.co"; title = "Coolors - Color Palette Generator"; categoryId = $catIds[2] },
    @{ url = "https://fonts.google.com"; title = "Google Fonts Library"; categoryId = $catIds[2] },

    # Learning Resources
    @{ url = "https://www.freecodecamp.org"; title = "freeCodeCamp - Learn to Code"; categoryId = $catIds[3] },
    @{ url = "https://www.udemy.com"; title = "Udemy - Online Courses"; categoryId = $catIds[3] },
    @{ url = "https://developer.mozilla.org"; title = "MDN Web Docs"; categoryId = $catIds[3] },
    @{ url = "https://www.typescriptlang.org/docs"; title = "TypeScript Handbook"; categoryId = $catIds[3] },
    @{ url = "https://roadmap.sh"; title = "Developer Roadmaps"; categoryId = $catIds[3] },

    # Productivity Tools
    @{ url = "https://github.com"; title = "GitHub - Code Hosting & Collaboration"; categoryId = $catIds[4] },
    @{ url = "https://vercel.com"; title = "Vercel - Deploy Frontend Apps"; categoryId = $catIds[4] },
    @{ url = "https://notion.so"; title = "Notion - All-in-One Workspace"; categoryId = $catIds[4] },
    @{ url = "https://code.visualstudio.com"; title = "Visual Studio Code Editor"; categoryId = $catIds[4] }
)

$bmCount = 0
foreach ($bm in $bookmarks) {
    $resp = ApiPost "/bookmarks" $bm
    $bmCount++
    Write-Host "  [$bmCount/$($bookmarks.Count)] $($bm.title)" -ForegroundColor Green
}

# 4. Create Standalone Notes
Write-Host "`n>> Creating notes..." -ForegroundColor Cyan
$notes = @(
    @{ title = "Angular vs React - Quick Comparison"; content = "Angular: Full framework, TypeScript-first, two-way binding, CLI-driven. Great for enterprise apps.`n`nReact: Library-focused, JSX, one-way data flow, huge ecosystem. Great for flexible SPAs.`n`nBoth are excellent choices - pick based on team and project needs."; categoryId = $catIds[0] },
    @{ title = "REST API Best Practices"; content = "1. Use nouns for endpoints (e.g., /users, /bookmarks)`n2. Use HTTP verbs correctly (GET, POST, PUT, DELETE)`n3. Return proper status codes (200, 201, 404, 500)`n4. Version your API (e.g., /api/v1/)`n5. Implement pagination for list endpoints`n6. Use JWT tokens for authentication"; categoryId = $catIds[1] },
    @{ title = "Color Palette Ideas for 2026"; content = "Trending palettes:`n- Deep Indigo + Coral + Cream (modern SaaS look)`n- Dark Slate + Electric Purple + Mint (tech/dark mode)`n- Warm Beige + Forest Green + Gold (organic/sustainable brands)`n`nTools: coolors.co, colorhunt.co, realtimecolors.com"; categoryId = $catIds[2] },
    @{ title = "Weekly Learning Plan"; content = "Monday: TypeScript advanced types (generics, utility types)`nTuesday: Angular signals and standalone components`nWednesday: CSS Grid advanced layouts`nThursday: REST API design with ASP.NET Core`nFriday: Build a mini-project combining all learnings`n`nGoal: Consistency over intensity!"; categoryId = $catIds[3] },
    @{ title = "Git Commands Cheat Sheet"; content = "git stash / git stash pop - Save work temporarily`ngit rebase -i HEAD~3 - Squash last 3 commits`ngit cherry-pick <hash> - Apply specific commit`ngit reflog - Find lost commits`ngit bisect - Find the commit that introduced a bug`n`nAlways pull before push. Use feature branches!"; categoryId = $catIds[4] },
    @{ title = "Project Ideas for Portfolio"; content = "1. Bookmark Manager (LinkVault!) - DONE`n2. Kanban Task Board - DONE`n3. Real-time Chat App (WebSockets)`n4. E-commerce Dashboard with Charts`n5. Personal Finance Tracker`n`nFocus on projects that demonstrate CRUD, auth, and responsive design."; categoryId = $catIds[3] }
)

$noteCount = 0
foreach ($note in $notes) {
    $resp = ApiPost "/notes" $note
    $noteCount++
    Write-Host "  [$noteCount/$($notes.Count)] $($note.title)" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SEED COMPLETE!" -ForegroundColor Green
Write-Host "  Categories: $($categories.Count)" -ForegroundColor White
Write-Host "  Bookmarks:  $($bookmarks.Count)" -ForegroundColor White
Write-Host "  Notes:      $($notes.Count)" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
