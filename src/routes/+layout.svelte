<script>
  import "../app.postcss";
  import { Layout } from "stwui";
</script>

<Layout class="h-full">
  <Layout.Header class="flex z-0 p-4"
    ><h3 class="flex justify-center">🌁 ZKSync Era ERC20 Bridge</h3>
    <Layout.Header.Extra slot="extra" />
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
