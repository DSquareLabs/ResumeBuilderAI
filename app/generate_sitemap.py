# generate_sitemap.py

# A list of high-volume keywords for your "Programmatic SEO" strategy
roles = [
    # Tech
    "software-engineer", "frontend-developer", "backend-developer", "full-stack-developer",
    "data-scientist", "product-manager", "ui-ux-designer", "devops-engineer", "qa-engineer",
    
    # Healthcare (High volume)
    "nurse", "registered-nurse", "medical-assistant", "dental-assistant", "pharmacist",
    "physical-therapist",
    
    # Business & Admin
    "administrative-assistant", "customer-service-representative", "project-manager",
    "marketing-manager", "accountant", "sales-representative", "human-resources-manager",
    "business-analyst", "executive-assistant",
    
    # Service & General
    "teacher", "server", "bartender", "driver", "receptionist", "electrician",
    "graphic-designer", "writer"
]

print("")
print("")

for role in roles:
    # We clean the role for the URL (already clean in list) but let's be safe
    slug = role.lower().replace(" ", "-")
    
    entry = f"""  <url>
    <loc>https://myresumematch.com/resume-for-{slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>"""
    print(entry)

print("")
print("")