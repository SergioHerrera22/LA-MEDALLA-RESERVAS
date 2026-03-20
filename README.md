# Agendar turnos taller mecánico

This is a code bundle for Agendar turnos taller mecánico. The original project is available at https://www.figma.com/design/OrfsJ3jFSqHGvCHyFI4A5S/Agendar-turnos-taller-mec%C3%A1nico.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

    ## Supabase

    This app now persists cabins, reservations and expenses in Supabase.

    1. Create a `.env.local` file with:
      - `VITE_SUPABASE_URL`
      - `VITE_SUPABASE_ANON_KEY`
    2. In the Supabase SQL Editor, run the script at `supabase/schema.sql` once.
    3. Start the app with `npm run dev`.

    Notes:

    - On the first load, the app seeds the `cabins` table if it is empty.
    - The SQL policies in `supabase/schema.sql` leave the tables open because this is an internal tool without authentication yet.
    - If you later add auth, tighten those policies before using the app outside the internal environment.
