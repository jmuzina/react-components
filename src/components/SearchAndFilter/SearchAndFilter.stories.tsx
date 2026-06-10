import React from "react";
import { Meta, StoryObj } from "@storybook/react";

import SearchAndFilter from "./SearchAndFilter";
import Navigation from "components/Navigation";

const meta: Meta<typeof SearchAndFilter> = {
  component: SearchAndFilter,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SearchAndFilter>;

export const Default: Story = {
  name: "Default",

  args: {
    returnSearchData: () => {},

    filterPanelData: [
      {
        id: 0,
        heading: "Cloud",

        chips: [
          {
            lead: "Cloud",
            value: "Google",
          },
          {
            lead: "Cloud",
            value: "AWS",
          },
          {
            lead: "Cloud",
            value: "Azure",
          },
        ],
      },
      {
        id: 1,
        heading: "Region",

        chips: [
          {
            lead: "Region",
            value: "us-east1",
          },
          {
            lead: "Region",
            value: "us-north2",
          },
          {
            lead: "Region",
            value: "us-south3",
          },
          {
            lead: "Region",
            value: "us-north4",
          },
          {
            lead: "Region",
            value: "us-east5",
          },
          {
            lead: "Region",
            value: "us-south6",
          },
          {
            lead: "Region",
            value: "us-east7",
          },
          {
            lead: "Region",
            value: "us-east8",
          },
          {
            lead: "Region",
            value: "us-east9",
          },
          {
            lead: "Region",
            value: "us-east10",
          },
        ],
      },
      {
        id: 2,
        heading: "Owner",

        chips: [
          {
            lead: "Owner",
            value: "foo",
          },
          {
            lead: "Owner",
            value: "bar",
          },
          {
            lead: "Owner",
            value: "baz",
          },
        ],
      },
    ],
  },
};

export const WithDataSet: Story = {
  name: "With data set",

  args: {
    filterPanelData: [
      {
        id: 0,
        heading: "Cloud",

        chips: [
          {
            lead: "Cloud",
            value: "Google",
          },
          {
            lead: "Cloud",
            value: "AWS",
          },
          {
            lead: "Cloud",
            value: "Azure",
          },
        ],
      },
      {
        id: 1,
        heading: "Region",

        chips: [
          {
            lead: "Region",
            value: "us-east1",
          },
          {
            lead: "Region",
            value: "us-north2",
          },
          {
            lead: "Region",
            value: "us-south3",
          },
          {
            lead: "Region",
            value: "us-north4",
          },
          {
            lead: "Region",
            value: "us-east5",
          },
          {
            lead: "Region",
            value: "us-south6",
          },
          {
            lead: "Region",
            value: "us-east7",
          },
          {
            lead: "Region",
            value: "us-east8",
          },
          {
            lead: "Region",
            value: "us-east9",
          },
          {
            lead: "Region",
            value: "us-east10",
          },
        ],
      },
      {
        id: 2,
        heading: "Owner",

        chips: [
          {
            lead: "Owner",
            value: "foo",
          },
          {
            lead: "Owner",
            value: "bar",
          },
          {
            lead: "Owner",
            value: "baz",
          },
        ],
      },
    ],

    returnSearchData: () => {},
  },
};

export const WithExistingSearchData: Story = {
  name: "With existing search data",

  args: {
    existingSearchData: [
      {
        lead: "Cloud",
        value: "Google",
      },
    ],

    filterPanelData: [
      {
        id: 0,
        heading: "Cloud",

        chips: [
          {
            lead: "Cloud",
            value: "Google",
          },
          {
            lead: "Cloud",
            value: "AWS",
          },
          {
            lead: "Cloud",
            value: "Azure",
          },
        ],
      },
      {
        id: 1,
        heading: "Region",

        chips: [
          {
            lead: "Region",
            value: "us-east1",
          },
          {
            lead: "Region",
            value: "us-north2",
          },
          {
            lead: "Region",
            value: "us-south3",
          },
          {
            lead: "Region",
            value: "us-north4",
          },
          {
            lead: "Region",
            value: "us-east5",
          },
          {
            lead: "Region",
            value: "us-south6",
          },
          {
            lead: "Region",
            value: "us-east7",
          },
          {
            lead: "Region",
            value: "us-east8",
          },
          {
            lead: "Region",
            value: "us-east9",
          },
          {
            lead: "Region",
            value: "us-east10",
          },
        ],
      },
      {
        id: 2,
        heading: "Owner",

        chips: [
          {
            lead: "Owner",
            value: "foo",
          },
          {
            lead: "Owner",
            value: "bar",
          },
          {
            lead: "Owner",
            value: "baz",
          },
        ],
      },
    ],

    returnSearchData: () => {},
  },
};

/**
 * **Bug: Escape does not close the filter panel when `Navigation` (with
 * search) is also on the page.**
 *
 * Both `SearchAndFilter` and `Navigation` (when `searchProps` is provided)
 * call `useOnEscapePressed` unconditionally — with no `isEnabled` guard — so
 * both register on the global LIFO escape-key stack **at mount time**,
 * regardless of whether their overlay is currently open.
 *
 * In this story `SearchAndFilter` renders first, so `Navigation` sits on top
 * of the stack permanently. When the user opens the filter panel and presses
 * Escape, `Navigation`'s `toggleSearch(false)` fires first — a no-op because
 * the nav search box is closed — and the filter panel remains open.
 *
 * **Steps to reproduce:**
 * 1. Click the search / filter input to open the filter panel.
 * 2. Press **Escape**.
 *
 * **Expected:** the filter panel closes.
 *
 * **Actual (bug):** `Navigation`'s `toggleSearch(false)` fires first (it's on
 * top of the LIFO stack because it mounted after `SearchAndFilter`), the call
 * is a no-op since the nav search box is already closed, and the filter panel
 * stays open. The user must press Escape a *second* time to close it (once
 * Navigation's handler has been "spent").
 *
 * **Root cause:** `useOnEscapePressed` in both components lacks
 * `{ isEnabled: <open-state> }`, so their handlers occupy permanent stack
 * slots regardless of visibility.
 */
export const BugEscapeConflictWithNavigation: Story = {
  name: "Bug: Escape conflict with Navigation",

  render: () => (
    // SearchAndFilter renders FIRST → registers first on the LIFO stack.
    // Navigation renders SECOND → registers second, sits on top.
    // Escape always dispatches to Navigation's handler first, even when
    // the nav search is closed and the filter panel is open.
    <div>
      <p style={{ padding: "1rem 1rem 0", color: "#666" }}>
        <strong>To reproduce the bug:</strong> click the search input below to
        open the filter panel, then press <kbd>Escape</kbd>. The filter panel
        should close but it does not — Navigation&apos;s handler fires first
        and is a no-op.
      </p>
      <div style={{ padding: "1rem" }}>
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
      {/* Navigation renders after SearchAndFilter, so it registers on top of the stack */}
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
    </div>
  ),
};
