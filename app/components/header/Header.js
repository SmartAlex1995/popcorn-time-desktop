// @flow
/* eslint react/no-set-state: 0 */
import {
  Button,
  Collapse,
  Form,
  Input,
  Nav,
  Navbar,
  NavbarToggler,
  NavItem
} from 'reactstrap';
import React, { Component } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import type { Node, SyntheticEvent as Event } from 'react';
import Butter from '../../api/Butter';

type Props = {
  setActiveMode: (mode: string, options?: { searchQuery: string }) => void,
  activeMode: string
};

export default class Header extends Component {
  props: Props;

  state: {
    searchQuery: string
  };

  butter: Butter;

  constructor(props: Props) {
    super(props);

    this.butter = new Butter();
    this.state = {
      searchQuery: ''
    };
  }

  /**
   * Set the mode of the movies to be 'search'
   */
  setSearchState(searchQuery: string) {
    this.props.setActiveMode('search', { searchQuery });
  }

  handleSearchChange({ target: { value } }: Event<HTMLButtonElement>) {
    this.setState({
      searchQuery: value
    });
  }

  handleKeyUp({ keyCode }: Event<HTMLButtonElement>) {
    if (keyCode === 27) {
      document.getElementById('pct-search-input').blur();
    }
  }

  handleKeyPress({ key }: Event<HTMLButtonElement>) {
    if (key === 'Enter') {
      // browserHistory.replace('/item/movies');
      // browserHistory.replace('/item/search');
      this.props.setActiveMode('search', {
        searchQuery: this.state.searchQuery
      });
    }
  }

  render(): Node {
    const { activeMode, setActiveMode } = this.props;
    const { searchQuery } = this.state;

    return (
      <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark col-sm-12 col-md-12">
        <Button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <NavbarToggler className="navbar-toggler-icon" />
        </Button>

        <Collapse
          className="collapse navbar-collapse"
          id="navbarSupportedContent"
        >
          <Nav className="navbar-nav mr-auto">
            <NavItem
              className={classNames('nav-item', {
                active: activeMode === 'home'
              })}
            >
              <Link
                className="nav-link"
                to="/item/home"
                replace
                onClick={() => this.props.setActiveMode('home')}
              >
                Home
              </Link>
            </NavItem>
            <NavItem
              className={classNames('nav-item', {
                active: activeMode === 'movies'
              })}
            >
              <Link
                to="/item/movies"
                replace
                className="nav-link"
                onClick={() => setActiveMode('movies')}
              >
                Movies
              </Link>
            </NavItem>
            <NavItem
              className={classNames('nav-item', {
                active: activeMode === 'shows'
              })}
            >
              <Link
                className="nav-link"
                to="/item/shows"
                replace
                onClick={() => setActiveMode('shows')}
              >
                TV Shows
              </Link>
            </NavItem>
          </Nav>
          <Form className="form-inline my-2 my-lg-0">
            <Input
              id="pct-search-input"
              className="form-control mr-sm-2"
              aria-label="Search"
              value={searchQuery}
              onKeyUp={event => this.handleKeyUp(event)}
              onKeyPress={event => this.handleKeyPress(event)}
              onChange={event => this.handleSearchChange(event)}
              type="text"
              placeholder="Search"
            />
          </Form>
        </Collapse>
      </Navbar>
    );
  }
}
