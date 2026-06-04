-- New Schema: partners, customers, additional_applicants, form_services, field_configurations
-- Based on SchemaAtual.sql with requested modifications
-- All table/column names in English

-- ============================================================
-- 1. PARTNERS (Novo - extraído de agendamentos)
-- ============================================================
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_by text, -- Novo
  updated_by text, -- Novo
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Novo
  CONSTRAINT partners_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 2. FORM SERVICES (traduzido de servicos)
-- ============================================================
CREATE TABLE public.form_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 3. CUSTOMERS (renomeado de agendamentos)
-- ============================================================
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_code text NOT NULL DEFAULT gerar_codigo_agendamento() UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  eye_color text NOT NULL,
  height_cm integer NOT NULL,
  address text NOT NULL,
  marital_status text NOT NULL,
  number_of_children integer NOT NULL DEFAULT 0,
  notes text,
  email_otp text,
  otp_email_password text,
  restriction_periods jsonb DEFAULT '[]'::jsonb,
  scheduled_at timestamp with time zone, -- Novo - data/hora em que o cliente foi agendado
  reservation_date timestamp with time zone, -- Novo - data da reserva
  status text NOT NULL DEFAULT 'EM_ANALISE', -- Novo
  previous_status text, -- Novo
  pending_issues text, -- Novo
  last_attempt timestamp with time zone, -- Novo
  partner_id uuid NOT NULL, -- Novo
  service_id uuid NOT NULL, -- Novo
  created_by text, -- Novo
  updated_by text, -- Novo
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(), -- Novo
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT customers_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.form_services(id),
  CONSTRAINT customers_unique_email_service_partner UNIQUE (email, service_id, partner_id) -- Novo
);

-- ============================================================
-- 4. ADDITIONAL APPLICANTS (renomeado de requerentes_adicionais)
-- ============================================================
CREATE TABLE public.additional_applicants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  birth_date text NOT NULL,
  height_cm integer,
  eye_color text,
  sort_order integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT additional_applicants_pkey PRIMARY KEY (id),
  CONSTRAINT additional_applicants_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- ============================================================
-- 5. FIELD CONFIGURATIONS (traduzido de configuracoes_campos)
-- ============================================================
CREATE TABLE public.field_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_id uuid,
  entity text NOT NULL CHECK (entity = ANY (ARRAY['titular'::text, 'requerente'::text])),
  field_name text NOT NULL,
  visible boolean DEFAULT true,
  required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT field_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT field_configurations_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.form_services(id)
);