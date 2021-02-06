--
-- PostgreSQL database dump
--

-- Dumped from database version 12.4 (Ubuntu 12.4-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.4 (Ubuntu 12.4-0ubuntu0.20.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY seminaire.state DROP CONSTRAINT IF EXISTS state_pkey;
ALTER TABLE IF EXISTS ONLY seminaire.answers DROP CONSTRAINT IF EXISTS answers_pkey;
ALTER TABLE IF EXISTS ONLY seminaire.agents DROP CONSTRAINT IF EXISTS agents_pkey;
ALTER TABLE IF EXISTS seminaire.agents ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS seminaire.state;
DROP TABLE IF EXISTS seminaire.answers;
DROP SEQUENCE IF EXISTS seminaire.agents_id_seq;
DROP TABLE IF EXISTS seminaire.agents;
DROP SCHEMA IF EXISTS seminaire;
--
-- Name: seminaire; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA seminaire;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agents; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.agents (
    id integer NOT NULL,
    nom character varying(30),
    prenom character varying(30),
    origine character varying(5),
    direction character varying(10),
    service character varying(10),
    unite character varying(50),
    fonction character varying(150),
    site character varying(30),
    present boolean,
    paire character varying(30),
    equipe integer DEFAULT trunc((random() * (4)::double precision))
);


--
-- Name: agents_id_seq; Type: SEQUENCE; Schema: seminaire; Owner: -
--

CREATE SEQUENCE seminaire.agents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: seminaire; Owner: -
--

ALTER SEQUENCE seminaire.agents_id_seq OWNED BY seminaire.agents.id;


--
-- Name: answers; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.answers (
    agent integer NOT NULL,
    question integer NOT NULL,
    answer integer
);


--
-- Name: state; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.state (
    id integer NOT NULL,
    val character varying(5)
);


--
-- Name: agents id; Type: DEFAULT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.agents ALTER COLUMN id SET DEFAULT nextval('seminaire.agents_id_seq'::regclass);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (agent, question);


--
-- Name: state state_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (id);


CREATE FUNCTION generate_testset(num_questions integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
	delete from seminaire.answers;
	insert into seminaire.answers (select id as agent,questions.*,floor(random()*4) as answer from (select question from generate_series(0,num_questions-1) as question) as questions,seminaire.agents);
end;
$$;

--
-- PostgreSQL database dump complete
--

