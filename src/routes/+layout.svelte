<script>
  import "../app.postcss";
  import { Icon, Layout } from "stwui";
  import { githubIcon } from "../../src/icons.js";
</script>

<Layout class="h-full">
  <Layout.Header class="flex z-0 p-4"
    ><h3 class="flex justify-center m-2">🌁 ZKSync Era ERC20 Bridge</h3>
    <Layout.Header.Extra slot="extra">
      <a class="hover:text-blue-600" href="https://github.com/zbcoding">
        <div class="inline-flex items-center m-2">
          <Icon class="mr-1" data={githubIcon} />@zbcoding
        </div>
      </a>
    </Layout.Header.Extra>
  </Layout.Header>
  <Layout.Content>
    <Layout.Content.Sidebar
      class="flex items-center justify-center min-h-[200px]"
    />
    <Layout.Content.Body class="flex items-center justify-center min-h-[200px]">
      <!--slot for page content-->
      <slot />
    </Layout.Content.Body>
    <Layout.Content.Sidebar
      class="flex items-center justify-center min-h-[200px]"
    />
  </Layout.Content>
  <Layout.Footer class="static z-0">
    <Layout.Footer.Extra slot="extra" />
  </Layout.Footer>
</Layout>
