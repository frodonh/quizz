--
-- PostgreSQL database dump
--

-- Dumped from database version 12.5 (Ubuntu 12.5-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.5 (Ubuntu 12.5-0ubuntu0.20.04.1)

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
ALTER TABLE IF EXISTS seminaire.questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS seminaire.games ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS seminaire.agents ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS seminaire.state;
DROP SEQUENCE IF EXISTS seminaire.questions_id_seq;
DROP TABLE IF EXISTS seminaire.questions;
DROP SEQUENCE IF EXISTS seminaire.games_id_seq;
DROP TABLE IF EXISTS seminaire.games;
DROP TABLE IF EXISTS seminaire.answers;
DROP SEQUENCE IF EXISTS seminaire.agents_id_seq;
DROP TABLE IF EXISTS seminaire.agents;
DROP FUNCTION IF EXISTS seminaire.score(good integer, bad integer);
DROP FUNCTION IF EXISTS seminaire.generate_testset(game integer);
DROP SCHEMA IF EXISTS seminaire;
--
-- Name: seminaire; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA seminaire;


--
-- Name: generate_testset(integer); Type: FUNCTION; Schema: seminaire; Owner: -
--

CREATE FUNCTION seminaire.generate_testset(game integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
	delete from seminaire.answers;
	insert into seminaire.answers (select id as agent,qu.question,floor(random()*4) as answer,game as game from (select unnest(questions) as question from seminaire.games where id=game) as qu,seminaire.agents);
end;
$$;


--
-- Name: score(integer, integer); Type: FUNCTION; Schema: seminaire; Owner: -
--

CREATE FUNCTION seminaire.score(good integer, bad integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
begin
	return good*3-bad;
end;
$$;


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
    answer integer,
    game integer NOT NULL
);


--
-- Name: games; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.games (
    id integer NOT NULL,
    questions integer[],
    name text
);


--
-- Name: games_id_seq; Type: SEQUENCE; Schema: seminaire; Owner: -
--

CREATE SEQUENCE seminaire.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: seminaire; Owner: -
--

ALTER SEQUENCE seminaire.games_id_seq OWNED BY seminaire.games.id;


--
-- Name: questions; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.questions (
    id integer NOT NULL,
    question text,
    answers text[],
    answer integer,
    explain_text text,
    explain_link text,
    media text
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: seminaire; Owner: -
--

CREATE SEQUENCE seminaire.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: seminaire; Owner: -
--

ALTER SEQUENCE seminaire.questions_id_seq OWNED BY seminaire.questions.id;


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
-- Name: games id; Type: DEFAULT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.games ALTER COLUMN id SET DEFAULT nextval('seminaire.games_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.questions ALTER COLUMN id SET DEFAULT nextval('seminaire.questions_id_seq'::regclass);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (game, agent, question);


--
-- Name: state state_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

