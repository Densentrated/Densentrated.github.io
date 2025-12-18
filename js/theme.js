/**
 * Switches the website to the desired theme.
 * @param {string} themeName - The name of the theme to apply.
 */
function switchTheme(themeName) {
  const validThemes = [
    "default",
    "pastel",
    "dark-purple",
    "retro",
    "ocean",
    "warm",
  ];

  if (!validThemes.includes(themeName)) {
    console.warn(
      `Invalid theme: \"${themeName}\". Falling back to default theme.`,
    );
    themeName = "default";
  }

  // Apply the theme by setting the data-theme attribute
  if (themeName === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeName);
  }
}
