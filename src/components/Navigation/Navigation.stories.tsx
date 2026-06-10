import React from "react";
import { Meta, StoryObj } from "@storybook/react";

import Navigation from "./Navigation";
import SearchAndFilter from "components/SearchAndFilter";
import { Theme } from "../../enums";

const meta: Meta<typeof Navigation> = {
  component: Navigation,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Navigation>;

/**
 * The default navigation is constrained to the max width of the Vanilla grid and
uses the light theme.
 */
export const Default: Story = {
  name: "Default",

  args: {
    items: [
      {
        label: "Products",
        url: "#",
      },
      {
        label: "Services",
        url: "#",
      },
      {
        label: "Partners",
        url: "#",
      },
    ],

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "Canonical",
      url: "#",
    },
  },
};

/**
 * You can switch to a dark themed Navigation by using the `dark` prop. This will
automatically update the Navigation items to use lighter text and hover state
colours.
 */
export const Dark: Story = {
  name: "Dark",

  args: {
    items: [
      {
        label: "Products",
        url: "#",
      },
      {
        label: "Services",
        url: "#",
      },
      {
        label: "Partners",
        url: "#",
      },
    ],

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "Canonical",
      url: "#",
    },

    theme: Theme.DARK,
  },
};

/**
 * Sub-navigation dropdown menus can be added to Navigation by adding an `items`
array instead of a URL. By default, the dropdown items will align to the left of the
parent item. This can be changed by adding `alignRight` to the subnav
object.
 */
export const Dropdown: Story = {
  name: "Dropdown",

  args: {
    items: [
      {
        items: [
          {
            label: "Introduction",
            url: "#",
          },
          {
            label: "News",
            url: "#",
          },
          {
            label: "Getting started - Command line",
            url: "#",
          },
          {
            label: "Getting started - OpenStack",
            url: "#",
          },
          {
            label: "Getting started - OpenNebula",
            url: "#",
          },
        ],

        label: "LXD",
      },
      {
        items: [
          {
            label: "Introduction",
            url: "#",
          },
          {
            label: "News",
            url: "#",
          },
          {
            label: "Getting started",
            url: "#",
          },
        ],

        label: "LXCFS",
      },
    ],

    itemsRight: [
      {
        alignRight: true,

        items: [
          {
            label: "Sign out",
            url: "#",
          },
        ],

        label: "My account",
      },
    ],

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "LXD",
      url: "#",
    },
  },
};

/**
 * Expanding search can be enabled by providing props to the underlying [`SearchBox`](/?path=/docs/searchbox--default-story)
component. Elements to toggle the Searchbox will be included automatically if
the SearchBox props are provided.
 */
export const Search: Story = {
  name: "Search",

  args: {
    items: [
      {
        label: "Products",
        url: "#",
      },
      {
        label: "Services",
        url: "#",
      },
      {
        label: "Partners",
        url: "#",
      },
    ],

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "Canonical",
      url: "#",
    },

    searchProps: {
      onSearch: () => null,
    },
  },
};

/**
 * Logos can be displayed using the new tag design. In cases where another logo
style is required then an element can be provided to the `logo` prop.
 */
export const OverridingTheLogo: Story = {
  name: "Overriding the logo",

  args: {
    items: [
      {
        label: "Products",
        url: "#",
      },
      {
        label: "Services",
        url: "#",
      },
      {
        label: "Partners",
        url: "#",
      },
    ],

    logo: (
      <img
        alt=""
        src="https://assets.ubuntu.com/v1/5d6da5c4-logo-canonical-aubergine.svg"
        width="100"
      />
    ),
  },
};

/**
 * In some cases such as when using [React Router](https://reactrouter.com/) it is
necessary to use custom components for links. When this is required then a
function can be passed to `generateLink` which should return your component.
Bear in mind that some props like classes and on-click events might be passed to
this function so take care in overriding any link props.
 */
export const OverridingTheLinkComponent: Story = {
  name: "Overriding the link component",

  args: {
    generateLink: ({ label, className }) => (
      <button className={className}>{label}</button>
    ),

    items: [
      {
        label: "Products",
        url: "#",
      },
      {
        label: "Services",
        url: "#",
      },
      {
        label: "Partners",
        url: "#",
      },
    ],

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "Canonical",
      url: "#",
    },
  },
};

export const NoMenuItems: Story = {
  name: "No menu items",

  args: {
    generateLink: ({ label, className }) => (
      <button className={className}>{label}</button>
    ),

    logo: {
      src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
      title: "Canonical",
      url: "#",
    },
  },
};

/**
 * **Bug: Escape does not close the Navigation search when `SearchAndFilter`
 * is also on the page.**
 *
 * Both `Navigation` (when `searchProps` is provided) and `SearchAndFilter`
 * call `useOnEscapePressed` unconditionally — with no `isEnabled` guard — so
 * both register on the global LIFO escape-key stack **at mount time**,
 * regardless of whether their overlay is currently open.
 *
 * In this story `Navigation` renders first, so `SearchAndFilter` sits on
 * top of the stack permanently. When the user opens Navigation's search box
 * and presses Escape, `SearchAndFilter`'s `closePanel()` fires first — a
 * no-op because the filter panel is closed — and the Navigation search box
 * remains open.
 *
 * **Steps to reproduce:**
 * 1. Click the 🔍 search icon in the navigation bar to open the search box.
 * 2. Press **Escape**.
 *
 * **Expected:** the Navigation search box closes.
 *
 * **Actual (bug):** `SearchAndFilter.closePanel()` fires first (it's on top
 * of the LIFO stack because it mounted after `Navigation`), the call is a
 * no-op since the filter panel is already closed, and the Navigation search
 * box stays open. The user must press Escape a *second* time to close it
 * (once SearchAndFilter's handler has been "spent").
 *
 * **Root cause:** `useOnEscapePressed` in both components lacks
 * `{ isEnabled: <open-state> }`, so their handlers occupy permanent stack
 * slots regardless of visibility.
 */
export const BugEscapeConflictWithSearchAndFilter: Story = {
  name: "Bug: Escape conflict with SearchAndFilter",

  render: () => (
    // Navigation renders FIRST → registers first on the LIFO stack.
    // SearchAndFilter renders SECOND → registers second, sits on top.
    // Escape always dispatches to SearchAndFilter's handler first, even
    // when the filter panel is closed and Navigation's search is open.
    <div>
      <Navigation
        logo={{
          src: "https://assets.ubuntu.com/v1/82818827-CoF_white.svg",
          title: "Canonical",
          url: "#",
        }}
        items={[
          { label: "Products", url: "#" },
          { label: "Services", url: "#" },
        ]}
        searchProps={{ onSearch: () => null }}
      />
      <div style={{ padding: "1rem" }}>
        <p style={{ marginBottom: "0.5rem", color: "#666" }}>
          <strong>To reproduce the bug:</strong> click the search icon (🔍) in
          the nav bar above to open the search box, then press{" "}
          <kbd>Escape</kbd>. The search box should close but it does not —
          SearchAndFilter&apos;s handler fires first and is a no-op.
        </p>
        <SearchAndFilter
          returnSearchData={() => {}}
          filterPanelData={[
            {
              id: 0,
              heading: "Cloud",
              chips: [
                { lead: "Cloud", value: "AWS" },
                { lead: "Cloud", value: "GCP" },
                { lead: "Cloud", value: "Azure" },
              ],
            },
          ]}
        />
      </div>
    </div>
  ),
};
