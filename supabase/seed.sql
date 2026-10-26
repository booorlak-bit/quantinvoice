-- Demo content mirroring the original Quantum Framer template.
-- Safe to delete once real invoices exist.

insert into public.business (name, email, contact_email, tagline, default_currency, default_notes)
values (
  'Quantum',
  'info@quantum.app',
  'info@quantum.app',
  'Invoice Manager',
  'USD',
  '[
    {"title": "Expenses", "body": "The Client shall reimburse the Designer for all reasonable expenses incurred during this Project."},
    {"title": "Payment", "body": "This Invoice can conveniently be paid via Credit Card.\nBank Details or Interac e-Transfer are available upon request."}
  ]'
)
on conflict (id) do nothing;

with demo (number, slug, title, status, client_name, client_email, issue_date, due_date, items) as (
  values
    ('QT-001', 'framer-landing-page', 'Framer Landing Page', 'paid', 'Framer', 'info@framer.com',
     date '2023-09-01', date '2023-09-15', '[
       {"title": "Figma Web Design", "description": "1 Screen", "amount": 1000},
       {"title": "Framer Web Development", "description": "1 Landing Page", "amount": 2000},
       {"title": "CMS Walkthrough", "description": "Video Tour", "amount": null},
       {"title": "Customer Support", "description": "Slack Channel", "amount": null}
     ]'),
    ('QT-002', 'fintech-app', 'Fintech App', 'draft', 'Zenith Capital', 'info@zenith.co',
     date '2023-09-01', date '2023-09-15', '[
       {"title": "Discovery Call", "description": "Digital Brand Strategy", "amount": null},
       {"title": "Wireframes", "description": "8 Low-Fidelity Mockups", "amount": 4000},
       {"title": "Figma UI Design", "description": "8 High-Fidelity Screens", "amount": 8000},
       {"title": "Developer Handoff", "description": "Prepare Assets for Production", "amount": null}
     ]'),
    ('QT-003', 'logo-design', 'Logo Design', 'not_paid', 'Studio 88', 'info@studio88.design',
     date '2023-09-05', date '2023-09-20', '[
       {"title": "Discovery Call", "description": "Discuss Brand Strategy", "amount": null},
       {"title": "Stylescapes", "description": "3 Styles", "amount": null},
       {"title": "Logo Design", "description": "1 Logo", "amount": 4000},
       {"title": "Brand Guide", "description": "8 Pages", "amount": 2000}
     ]'),
    ('QT-004', 'studio-website', 'Studio Website', 'paid', 'Nomad Collective', 'info@nomad.co',
     date '2023-09-10', date '2023-09-25', '[
       {"title": "Discovery Call", "description": "Digital Brand Strategy", "amount": null},
       {"title": "Figma Web Design", "description": "6 Screens", "amount": 3000},
       {"title": "Framer Web Development", "description": "6 Pages", "amount": 6000}
     ]'),
    ('QT-005', 'framer-template', 'Framer Template', 'not_paid', 'Framer', 'info@framer.com',
     date '2023-09-20', date '2023-10-05', '[
       {"title": "Figma Web Design", "description": "4 Screens", "amount": 2000},
       {"title": "Framer Web Development", "description": "4 Pages + CMS", "amount": 4000},
       {"title": "Lemon Squeezy Store", "description": "Setup Product Page", "amount": null}
     ]'),
    ('QT-006', 'nft-site', 'NFT Site', 'not_paid', 'Coin Bank', 'info@coinbank.com',
     date '2023-09-25', date '2023-10-10', '[
       {"title": "Figma Web Design", "description": "8 Screens", "amount": 4000},
       {"title": "Framer Web Development", "description": "8 Pages", "amount": 8000},
       {"title": "CMS Walkthrough", "description": "Video Tour", "amount": null},
       {"title": "Customer Support", "description": "Slack Channel", "amount": null}
     ]')
),
inserted as (
  insert into public.invoices (number, slug, title, status, client_name, client_email, issue_date, due_date, notes)
  select d.number, d.slug, d.title, d.status::public.invoice_status, d.client_name, d.client_email,
         d.issue_date, d.due_date, (select default_notes from public.business)
  from demo d
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.invoice_items (invoice_id, position, title, description, amount)
select i.id, item.ordinality, item.value ->> 'title', item.value ->> 'description', (item.value ->> 'amount')::numeric
from inserted i
join demo d on d.slug = i.slug
cross join lateral jsonb_array_elements(d.items::jsonb) with ordinality as item (value, ordinality);
