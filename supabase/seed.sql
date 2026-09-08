-- Seed Tambi (First client)
INSERT INTO public.clients (
    id, business_name, logo_url, brand_colour, google_review_url, 
    owner_whatsapp, owner_email, alert_threshold, webhook_url, status
) VALUES (
    'tambi',
    'Tambi Filter Coffee',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=80',
    '#B45309',
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    '+919820012345',
    'owner@tambicafe.in',
    3,
    'https://hook.eu2.make.com/demo-tambi-webhook',
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    business_name = EXCLUDED.business_name,
    brand_colour = EXCLUDED.brand_colour,
    google_review_url = EXCLUDED.google_review_url;

-- Seed Demo Client (for Landing Page embedded live demo)
INSERT INTO public.clients (
    id, business_name, logo_url, brand_colour, google_review_url, 
    owner_whatsapp, owner_email, alert_threshold, webhook_url, status
) VALUES (
    'demo',
    'Demo Café & Kitchen',
    null,
    '#2563EB',
    'https://search.google.com/local/writereview?placeid=demo',
    '+919999999999',
    'demo@autofocuss.com',
    3,
    null,
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    business_name = EXCLUDED.business_name,
    brand_colour = EXCLUDED.brand_colour;

-- Seed 3 realistic submissions for Tambi
INSERT INTO public.submissions (client_id, name, phone, rating, comment, source, created_at)
VALUES 
('tambi', 'Rohan Sharma', '9820198201', 5, 'Authentic degree filter coffee and piping hot medu vada! Best spot in Vasai.', 'qr', NOW() - INTERVAL '2 hours'),
('tambi', 'Priya Patil', '9769123456', 5, 'Quick service and lovely atmosphere for morning breakfast.', 'qr', NOW() - INTERVAL '1 day'),
('tambi', 'Amit Sawant', '9167890123', 2, 'Waiting time for the table was almost 25 minutes on Sunday morning.', 'qr', NOW() - INTERVAL '3 days');
