<script>
    import { Card, Media } from "stwui";

    export let txUrl;

    $: {
        txUrl = txUrl ?? "https://etherscan.io";
    }
</script>

<Card bordered={false}>
    <Card.Content slot="content">
        <Media>
            <Media.Content>
                <Media.Content.Title
                    >Transaction on Block Explorer</Media.Content.Title
                >
                <Media.Content.Description
                    ><a
                        class="text-blue-500 underline hover:no-underline font-medium"
                        href={txUrl}
                        target="_blank">{txUrl}</a
                    ></Media.Content.Description
                >
            </Media.Content>
        </Media>
    </Card.Content>
</Card>
