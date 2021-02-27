--
-- PostgreSQL database dump
--

-- Dumped from database version 12.6 (Ubuntu 12.6-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.6 (Ubuntu 12.6-0ubuntu0.20.04.1)

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

ALTER TABLE IF EXISTS ONLY seminaire.state DROP CONSTRAINT IF EXISTS state_game_fkey;
ALTER TABLE IF EXISTS ONLY seminaire.questions DROP CONSTRAINT IF EXISTS questions_game_fkey;
ALTER TABLE IF EXISTS ONLY seminaire.answers DROP CONSTRAINT IF EXISTS answers_question_fkey;
ALTER TABLE IF EXISTS ONLY seminaire.answers DROP CONSTRAINT IF EXISTS answers_game_fkey;
ALTER TABLE IF EXISTS ONLY seminaire.answers DROP CONSTRAINT IF EXISTS answers_agent_fkey;
ALTER TABLE IF EXISTS ONLY seminaire.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY seminaire.games DROP CONSTRAINT IF EXISTS games_pkey;
ALTER TABLE IF EXISTS ONLY seminaire.answers DROP CONSTRAINT IF EXISTS answers_pkey;
ALTER TABLE IF EXISTS ONLY seminaire.agents DROP CONSTRAINT IF EXISTS agents_pkey;
ALTER TABLE IF EXISTS seminaire.questions ALTER COLUMN cd_question DROP DEFAULT;
ALTER TABLE IF EXISTS seminaire.agents ALTER COLUMN cd_agent DROP DEFAULT;
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
    cd_agent integer NOT NULL,
    nom character varying(30),
    prenom character varying(30),
    origine character varying(5),
    direction text,
    service text,
    unite text,
    fonction text,
    site text,
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

ALTER SEQUENCE seminaire.agents_id_seq OWNED BY seminaire.agents.cd_agent;


--
-- Name: answers; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.answers (
    cd_agent integer NOT NULL,
    cd_question integer NOT NULL,
    answer integer,
    cd_game text NOT NULL
);


--
-- Name: games; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.games (
    cd_game text DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
    questions integer[],
    name text,
    pkey text DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring)
);


--
-- Name: games_id_seq; Type: SEQUENCE; Schema: seminaire; Owner: -
--

CREATE SEQUENCE seminaire.games_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: seminaire; Owner: -
--

ALTER SEQUENCE seminaire.games_id_seq OWNED BY seminaire.games.cd_game;


--
-- Name: questions; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.questions (
    cd_question integer NOT NULL,
    question text,
    answers text[],
    right_answer integer,
    explain_text text,
    explain_link text,
    media text,
    explain_media text,
    cd_game text
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: seminaire; Owner: -
--

CREATE SEQUENCE seminaire.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: seminaire; Owner: -
--

ALTER SEQUENCE seminaire.questions_id_seq OWNED BY seminaire.questions.cd_question;


--
-- Name: state; Type: TABLE; Schema: seminaire; Owner: -
--

CREATE TABLE seminaire.state (
    cd_game text NOT NULL,
    val character varying(5)
);


--
-- Name: agents cd_agent; Type: DEFAULT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.agents ALTER COLUMN cd_agent SET DEFAULT nextval('seminaire.agents_id_seq'::regclass);


--
-- Name: questions cd_question; Type: DEFAULT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.questions ALTER COLUMN cd_question SET DEFAULT nextval('seminaire.questions_id_seq'::regclass);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (cd_agent);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (cd_game, cd_agent, cd_question);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (cd_game);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (cd_question);


--
-- Name: answers answers_agent_fkey; Type: FK CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_agent_fkey FOREIGN KEY (cd_agent) REFERENCES seminaire.agents(cd_agent) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answers answers_game_fkey; Type: FK CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_game_fkey FOREIGN KEY (cd_game) REFERENCES seminaire.games(cd_game) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answers answers_question_fkey; Type: FK CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.answers
    ADD CONSTRAINT answers_question_fkey FOREIGN KEY (cd_question) REFERENCES seminaire.questions(cd_question) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_game_fkey; Type: FK CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.questions
    ADD CONSTRAINT questions_game_fkey FOREIGN KEY (cd_game) REFERENCES seminaire.games(cd_game) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: state state_game_fkey; Type: FK CONSTRAINT; Schema: seminaire; Owner: -
--

ALTER TABLE ONLY seminaire.state
    ADD CONSTRAINT state_game_fkey FOREIGN KEY (cd_game) REFERENCES seminaire.games(cd_game) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

