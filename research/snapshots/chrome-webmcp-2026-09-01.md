[Skip to main content](https://developer.chrome.com/docs/ai/webmcp#main-content)

[![Chrome for Developers](https://www.gstatic.com/devrel-devsite/prod/v6c08f9bb601564cd99488472d05cdf6fb06f007f31b6552465782b15883ce123/chrome/images/lockup.svg)](https://developer.chrome.com/)

`/`

- English
- Deutsch
- Español – América Latina
- Français
- Indonesia
- Italiano
- Nederlands
- Polski
- Português – Brasil
- Tiếng Việt
- Türkçe
- Русский
- עברית
- العربيّة
- فارسی
- हिंदी
- বাংলা
- ภาษาไทย
- 中文 – 简体
- 中文 – 繁體
- 日本語
- 한국어

Sign in

- [Docs](https://developer.chrome.com/docs)
- [AI on Chrome](https://developer.chrome.com/docs/ai)

- [Home](https://developer.chrome.com/)
- [Docs](https://developer.chrome.com/docs)
- [AI on Chrome](https://developer.chrome.com/docs/ai)
- [WebMCP and Agents](https://developer.chrome.com/docs/ai/agents)

# WebMCP    Stay organized with collections      Save and categorize content based on your preferences.

![Alexandra Klepper](https://web.dev/images/authors/alexandraklepper.jpg)


Alexandra Klepper


[GitHub](https://github.com/alexandrascript) [Bluesky](https://bsky.app/profile/alexandrascript.com)

Published: May 18, 2026, Last updated: August 7, 2026

[WebMCP](https://github.com/webmachinelearning/webmcp?tab=readme-ov-file) is a
proposed web standard to help you build and expose structured tools for AI
[agents](https://web.dev/articles/ai-agents). WebMCP provides JavaScript and
annotates HTML form elements so that agents know exactly how to interact with
page features, to support a user's experience. This can significantly improve
the performance and reliability of agent actuation.

AI agents are a newer technology. They can help human users better complete
tasks which are highly complex and technical. WebMCP offers higher accuracy for
agentic task completion, and it can be added as a progressive enhancement.

| Explainer | Web | Extensions | Chrome Status | Intent |
| --- | --- | --- | --- | --- |
| [GitHub](https://github.com/webmachinelearning/webmcp) | [![Origin trial](https://developer.chrome.com/static/images/experiment.svg) Origin trial](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241) |  | [View](https://chromestatus.com/feature/5117755740913664) | [Intent to Experiment](https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ) |

## Why WebMCP?

WebMCP can help you bridge the gap between web applications and agents,
improving efficiency, reliability, and task completion, by providing rules for
interaction. Instead of an agent reviewing the element, such as a button or a
field, to understand its purpose, the website declares the element's purpose,
so it's used correctly

This is more reliable than actuation, which may have numerous steps and leaves
each step open to interpretation by the agent.

On the left, the agent scrapes the DOM. On the right, the agent
calls a tool. Try it yourself on our
[appointment booking demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/#compare).

Websites can share explicit purpose, such as search or purchasing, by defining
a `tool`. Tools execute on your webpage visibly, so users gain trust
that tasks are completed as expected. This also keeps your brand and
human-centered design choices intact.

WebMCP supports:

- **Discovery**: A standard way for pages to register tools with agents, such
as `checkout` or `filter_results`.
- [**JSON Schemas**](https://json-schema.org/understanding-json-schema/reference):
Explicit definitions of inputs and expected outputs, to reduce hallucination
or misunderstanding.
- **State**: A shared understanding of the current page context, so the agent
knows what resources are available to act on in real time.

Our goal is to build APIs that any browser with agentic capabilities can
implement and benefit from, so your users can more easily complete tasks. You
can follow along this process on
[GitHub](https://github.com/webmachinelearning/webmcp).

### Use cases

There are many ways you could use WebMCP on the web. For example:

- **Help your customers get support**. If you provide a software to customers,
you may have a complex support flow to address many different questions. You
can use WebMCP to help an agent more quickly navigate to the right form and
fill in fields with user-provided information.
- **Improve travel booking**. Help agents book complex, multi-city and
multi-passenger trips with fewer steps.

Some actions may be sensitive, such as making a purchase. You can include a
command to request user interaction with a confirmation dialog.

In a practical sense, your tools could accomplish the following tasks:

- **Fill in structured forms**: Build a `submit_application` tool to help agents
map data collected from the conversation with the user to form fields
correctly. For example, you can differentiate if a field requires a full name
versus a separate first and last name.
- **Support agent interactions in human-first interfaces**: Certain fields are
designed for human users, but may not be understood by agents. You could build
a `date_pick` tool that allows for a complex date and time selection in a
reservation or event booking.
- **Quicker application debugging**: You can build a `run_diagnostics` tool on a
developer settings page, so an agent can trigger fixes that are otherwise
hidden behind nested menus.

Is your use case missing? Or do you have an idea you're excited to share for
WebMCP? [Raise questions and participate in discussion on GitHub](https://github.com/webmachinelearning/webmcp?tab=readme-ov-file).

## Get started

Join the [WebMCP origin trial](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241)
from Chrome 149. Learn more about how to
[get started with origin trials](https://developer.chrome.com/docs/web-platform/origin-trials).

### Local WebMCP

WebMCP is available as a Chrome flag for local development:

1. Open Chrome and navigate to `chrome://flags/#enable-webmcp-testing`
2. Set the flag to **Enabled**.
3. Relaunch Chrome to apply the changes.

## Use WebMCP APIs

There are two APIs you can use to set up your website tools:

- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api): Define different types of
tools with standard JavaScript, such as form input, navigation tools, state
management, or other functions.
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api): Add annotations to a standard
HTML forms to create a WebMCP tool.

### Limitations

While WebMCP aims to make complex tasks simpler for agents and humans, there are
limitations:

- **Headless browsing scenarios**: While it may be possible to run WebMCP tools
in headless environments, this API is primarily designed for local browser
workflows with a human in the loop.
- **Overhead for complex interfaces**: If your site is highly complex, you
likely need to refactor or add JavaScript to handle application and interface
state.
- **Tool discoverability**: Clients and browsers must visit a site directly to
know if it has callable tools.

### Security and permissions

WebMCP APIs are gated by both origin isolation requirements and permissions
policy.

#### Origin isolation

WebMCP is only available in [origin-isolated](https://web.dev/articles/origin-agent-cluster#limitations)
documents. This ensures that the document's origin remains stable throughout
the tool's lifetime.

If a document has `document.domain` enabled (for example, by using the
`Origin-Agent-Cluster: ?0` HTTP header), WebMCP APIs are disabled.

#### Permissions policy

Both APIs are gated by the `tools` [Permissions Policy](https://developer.chrome.com/docs/privacy-security/permissions-policy).
The policy defaults to `self`, which allows tool registration in top-level and
same-origin contexts, and disables it for cross-origin iframes.

To allow WebMCP tools in a cross-origin iframe, add the `allow="tools"`
attribute to the iframe.

## Demo

Examples of demos covering both imperative and declarative implementations are
available:

- [WebMCP zaMaker](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/pizza-maker)
uses the WebMCP Imperative API.
- [Travel demo (React)](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/react-flightsearch)
uses the WebMCP Imperative API.
- [Le Petit Bistro demo](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/french-bistro)
uses the WebMCP Declarative API.

You can also review and explore the demo source code on
[GitHub](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos).

## Imitate agent chat with the inspector extension

[Install the Model Context Tool Inspector Extension](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
to experiment with an agent and see how WebMCP tools work in live demos or your
own applications. Use natural language prompts to determine if the agent
interacts with WebMCP tools as expected.

With the extension, you can:

- See which tools are registered on a page, by monitoring the WebMCP API.
- Manually call tools and execute functions.
- Verify your JSON Schema is correctly defined and that the browser can parse
data as the tool expects.
- View structured output or error messages returned by your tool to ensure
they're written clearly and formatted correctly, so an agent can understand it.

Talk to the agent using natural language, to see if it can correctly identify
and invoke the appropriate WebMCP tools. Your prompts are sent by default to the
`gemini-3-flash-preview` model.

## Engage and share feedback

WebMCP is under active discussion and subject to change in the future. If you
try these APIs and have feedback, we'd love to hear it.

- Join the [WebMCP origin trial](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241),
and follow the implementation for Chrome on
[Chrome Status](https://chromestatus.com/feature/5117755740913664).
- [Read the WebMCP explainer](https://github.com/webmachinelearning/webmcp?tab=readme-ov-file),
raise questions and participate in discussion.
- Read [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices).
- Read our [WebMCP tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) and
[best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices).
- If you have feedback on Chrome's implementation, file a
[Chromium bug](https://crbug.com/new?component=2021259).

[Next\\
\\
Imperative API\\
\\
arrow\_forward](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-08-07 UTC.




\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-08-07 UTC."\],\[\],\[\]\]